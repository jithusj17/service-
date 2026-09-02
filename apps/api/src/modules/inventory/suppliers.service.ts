import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { ClsService } from 'nestjs-cls';
import { AuditService } from '../audit/audit.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateSupplierDto, userId?: string, ipAddress?: string) {
    const tenantId = this.cls.get('tenantId');
    const supplier = await this.prisma.extended.supplier.create({
      data: {
        ...dto,
        tenantId,
      },
    });

    await this.auditService.logEvent({
      action: 'SUPPLIER_CREATED',
      userId,
      tenantId,
      ipAddress,
      details: { supplierId: supplier.id },
    });

    return supplier;
  }

  async findAll(query: QueryInventoryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;
    const tenantId = this.cls.get('tenantId');

    const where: Prisma.SupplierWhereInput = { tenantId };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [total, data] = await Promise.all([
      this.prisma.extended.supplier.count({ where }),
      this.prisma.extended.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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

  async findOne(id: string) {
    const supplier = await this.prisma.extended.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto, userId?: string, ipAddress?: string) {
    const existing = await this.findOne(id);

    const supplier = await this.prisma.extended.supplier.update({
      where: { id },
      data: dto,
    });

    await this.auditService.logEvent({
      action: 'SUPPLIER_UPDATED',
      userId,
      tenantId: this.cls.get('tenantId'),
      ipAddress,
      details: { supplierId: id },
    });

    return supplier;
  }
}
