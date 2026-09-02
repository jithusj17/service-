import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import { QueryServiceRequestDto } from './dto/query-service-request.dto';
import { AuditService } from '../audit/audit.service';
import { Prisma, ServiceRequestState } from '@prisma/client';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class ServiceRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cls: ClsService,
  ) {}

  async create(dto: CreateServiceRequestDto, userId?: string, ipAddress?: string) {
    const asset = await this.prisma.extended.asset.findUnique({
      where: { id: dto.assetId },
      include: { customer: true },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const serviceRequest = await this.prisma.extended.serviceRequest.create({
      data: {
        assetId: dto.assetId,
        customerId: asset.customerId,
        problemDescription: dto.problemDescription,
        priority: dto.priority,
        attachments: dto.attachments ? (dto.attachments as Prisma.InputJsonValue) : undefined,
      } as any,
    });

    await this.auditService.logEvent({
      action: 'SERVICE_REQUEST_CREATED',
      userId,
      tenantId: this.cls.get('tenantId'),
      ipAddress,
      details: { serviceRequestId: serviceRequest.id },
    });

    return serviceRequest;
  }

  async findAll(query: QueryServiceRequestDto) {
    const { page = 1, limit = 10, search, customerId, assetId, state, priority } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceRequestWhereInput = {};

    if (customerId) where.customerId = customerId;
    if (assetId) where.assetId = assetId;
    if (state) where.state = state;
    if (priority) where.priority = priority;
    if (search) {
      where.problemDescription = { contains: search, mode: 'insensitive' };
    }

    const [total, data] = await Promise.all([
      this.prisma.extended.serviceRequest.count({ where }),
      this.prisma.extended.serviceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          asset: true,
          customer: true,
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
    const request = await this.prisma.extended.serviceRequest.findUnique({
      where: { id },
      include: {
        asset: true,
        customer: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Service Request not found');
    }

    return request;
  }

  async update(id: string, dto: UpdateServiceRequestDto, userId?: string, ipAddress?: string) {
    const existing = await this.prisma.extended.serviceRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Service Request not found');
    }

    // State validation (optional basic checks, e.g. can't reject a converted one)
    if (existing.state === ServiceRequestState.CONVERTED_TO_WORK_ORDER && dto.state && dto.state !== ServiceRequestState.CONVERTED_TO_WORK_ORDER) {
      throw new BadRequestException('Cannot change state of a converted service request');
    }

    const updated = await this.prisma.extended.serviceRequest.update({
      where: { id },
      data: {
        problemDescription: dto.problemDescription,
        priority: dto.priority,
        state: dto.state,
        attachments: dto.attachments ? (dto.attachments as Prisma.InputJsonValue) : undefined,
      },
    });

    if (existing.state !== updated.state) {
      await this.auditService.logEvent({
        action: 'SERVICE_REQUEST_STATE_CHANGED',
        userId,
        tenantId: this.cls.get('tenantId'),
        ipAddress,
        details: { serviceRequestId: id, from: existing.state, to: updated.state },
      });
    } else {
      await this.auditService.logEvent({
        action: 'SERVICE_REQUEST_UPDATED',
        userId,
        tenantId: this.cls.get('tenantId'),
        ipAddress,
        details: { serviceRequestId: id },
      });
    }

    return updated;
  }
}
