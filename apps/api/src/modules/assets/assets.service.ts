import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { QueryAssetDto } from './dto/query-asset.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAssetDto) {
    // Verify customer exists and belongs to tenant
    const customer = await this.prisma.extended.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return await this.prisma.extended.asset.create({
      data: {
        customerId: dto.customerId,
        assetType: dto.assetType,
        brand: dto.brand,
        model: dto.model,
        serialNumber: dto.serialNumber,
        color: dto.color,
        notes: dto.notes,
        attributes: dto.attributes ? (dto.attributes as Prisma.InputJsonValue) : undefined,
      } as any,
    });
  }

  async findAll(query: QueryAssetDto) {
    const { page = 1, limit = 10, search, customerId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AssetWhereInput = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.extended.asset.count({ where }),
      this.prisma.extended.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true, // Optionally include customer info
        },
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
    const asset = await this.prisma.extended.asset.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  async update(id: string, dto: UpdateAssetDto) {
    try {
      return await this.prisma.extended.asset.update({
        where: { id },
        data: {
          assetType: dto.assetType,
          brand: dto.brand,
          model: dto.model,
          serialNumber: dto.serialNumber,
          color: dto.color,
          notes: dto.notes,
          attributes: dto.attributes ? (dto.attributes as Prisma.InputJsonValue) : undefined,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Asset not found');
      }
      throw error;
    }
  }
}
