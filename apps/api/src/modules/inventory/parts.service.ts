import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { ClsService } from 'nestjs-cls';
import { AuditService } from '../audit/audit.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PartsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreatePartDto, userId?: string, ipAddress?: string) {
    const tenantId = this.cls.get('tenantId');
    
    // Ensure partNumber is unique within the tenant
    if (dto.partNumber) {
      const existing = await this.prisma.extended.part.findUnique({
        where: { tenantId_partNumber: { tenantId, partNumber: dto.partNumber } },
      });
      if (existing) throw new BadRequestException('Part number must be unique');
    }

    const part = await this.prisma.extended.part.create({
      data: {
        ...dto,
        tenantId,
      },
    });

    await this.auditService.logEvent({
      action: 'PART_CREATED',
      userId,
      tenantId,
      ipAddress,
      details: { partId: part.id },
    });

    return part;
  }

  async findAll(query: QueryInventoryDto) {
    const { page = 1, limit = 10, search, supplierId } = query;
    const skip = (page - 1) * limit;
    const tenantId = this.cls.get('tenantId');

    const where: Prisma.PartWhereInput = { tenantId };

    if (supplierId) where.supplierId = supplierId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { partNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.extended.part.count({ where }),
      this.prisma.extended.part.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { supplier: true },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findLowStock() {
    const tenantId = this.cls.get('tenantId');
    // We cannot easily do stockQuantity <= minStockQuantity directly via Prisma generic findMany if they are both fields
    // Oh wait, we can't compare two column values dynamically in Prisma `where` clause natively.
    // Instead, we query using raw or we just pull parts where stockQuantity is generally low if we don't have thousands,
    // or we use `$queryRaw`. Since this is typical SaaS, let's use raw query for true database-level comparison.
    
    return this.prisma.extended.$queryRaw`
      SELECT p.*, s.name as "supplierName"
      FROM parts p
      LEFT JOIN suppliers s ON p."supplierId" = s.id
      WHERE p."tenantId" = ${tenantId} AND p."stockQuantity" <= p."minStockQuantity"
      ORDER BY p."stockQuantity" ASC
    `;
  }

  async findOne(id: string) {
    const part = await this.prisma.extended.part.findUnique({
      where: { id },
      include: { supplier: true },
    });

    if (!part) {
      throw new NotFoundException('Part not found');
    }

    return part;
  }

  async update(id: string, dto: UpdatePartDto, userId?: string, ipAddress?: string) {
    const tenantId = this.cls.get('tenantId');
    const existing = await this.findOne(id);

    if (dto.partNumber && dto.partNumber !== existing.partNumber) {
      const conflict = await this.prisma.extended.part.findUnique({
        where: { tenantId_partNumber: { tenantId, partNumber: dto.partNumber } },
      });
      if (conflict) throw new BadRequestException('Part number must be unique');
    }

    const part = await this.prisma.extended.part.update({
      where: { id },
      data: dto,
    });

    await this.auditService.logEvent({
      action: 'PART_UPDATED',
      userId,
      tenantId,
      ipAddress,
      details: { partId: id },
    });

    return part;
  }

  async adjustStock(id: string, dto: AdjustStockDto, userId?: string, ipAddress?: string) {
    const tenantId = this.cls.get('tenantId');
    const existing = await this.findOne(id);

    // Concurrency-safe atomic update
    const result = await this.prisma.extended.$transaction(async (tx) => {
      const updatedPart = await tx.part.update({
        where: { id },
        data: { stockQuantity: { increment: dto.quantity } },
      });

      if (updatedPart.stockQuantity < 0) {
        throw new BadRequestException('Cannot reduce stock below 0');
      }

      const transaction = await tx.inventoryTransaction.create({
        data: {
          partId: id,
          tenantId,
          userId,
          type: dto.type,
          quantity: dto.quantity,
          referenceId: dto.referenceId,
          notes: dto.notes,
        },
      });

      return { part: updatedPart, transaction };
    });

    await this.auditService.logEvent({
      action: 'STOCK_ADJUSTED',
      userId,
      tenantId,
      ipAddress,
      details: { partId: id, quantityChange: dto.quantity, type: dto.type },
    });

    return result.part;
  }

  async getTransactions(partId: string) {
    return this.prisma.extended.inventoryTransaction.findMany({
      where: { partId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });
  }
}
