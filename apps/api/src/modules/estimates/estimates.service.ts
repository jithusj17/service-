import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';
import { ApproveEstimateDto } from './dto/approve-estimate.dto';
import { AuditService } from '../audit/audit.service';
import { ClsService } from 'nestjs-cls';
import { EstimateStatus, WorkOrderStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class EstimatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cls: ClsService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async create(dto: CreateEstimateDto, userId?: string, ipAddress?: string) {
    const estimate = await this.prisma.extended.estimate.create({
      data: {
        workOrderId: dto.workOrderId,
        tenantId: this.cls.get('tenantId'),
        laborItems: dto.laborItems ?? [],
        parts: dto.parts ?? [],
        subtotal: dto.subtotal,
        tax: dto.tax ?? 0,
        discount: dto.discount ?? 0,
        total: dto.total,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null,
        status: EstimateStatus.DRAFT,
      },
    });

    await this.auditService.logEvent({
      action: 'ESTIMATE_CREATED',
      userId,
      tenantId: this.cls.get('tenantId'),
      ipAddress,
      details: { estimateId: estimate.id, workOrderId: dto.workOrderId },
    });

    this.realtimeService.emitToTenant(estimate.tenantId, 'estimate.updated', estimate);

    return estimate;
  }

  async findByWorkOrder(workOrderId: string) {
    return this.prisma.extended.estimate.findMany({
      where: { workOrderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const estimate = await this.prisma.extended.estimate.findUnique({
      where: { id },
    });

    if (!estimate) {
      throw new NotFoundException('Estimate not found');
    }

    return estimate;
  }

  async update(id: string, dto: UpdateEstimateDto, userId?: string, ipAddress?: string) {
    const existing = await this.prisma.extended.estimate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Estimate not found');
    }

    if (existing.status !== EstimateStatus.DRAFT) {
      throw new BadRequestException('Can only update estimates in DRAFT status');
    }

    const estimate = await this.prisma.extended.estimate.update({
      where: { id },
      data: {
        laborItems: dto.laborItems,
        parts: dto.parts,
        subtotal: dto.subtotal,
        tax: dto.tax,
        discount: dto.discount,
        total: dto.total,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : undefined,
      },
    });

    await this.auditService.logEvent({
      action: 'ESTIMATE_UPDATED',
      userId,
      tenantId: this.cls.get('tenantId'),
      ipAddress,
      details: { estimateId: estimate.id },
    });

    this.realtimeService.emitToTenant(estimate.tenantId, 'estimate.updated', estimate);

    return estimate;
  }

  async updateStatus(id: string, status: EstimateStatus, userId?: string, ipAddress?: string) {
    const existing = await this.prisma.extended.estimate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Estimate not found');
    }

    const estimate = await this.prisma.extended.estimate.update({
      where: { id },
      data: { status },
    });

    await this.auditService.logEvent({
      action: 'ESTIMATE_STATUS_CHANGED',
      userId,
      tenantId: this.cls.get('tenantId'),
      ipAddress,
      details: { estimateId: id, oldStatus: existing.status, newStatus: status },
    });

    if (status === EstimateStatus.SENT) {
      const workOrder = await this.prisma.extended.workOrder.findUnique({
        where: { id: estimate.workOrderId },
      });
      if (workOrder) {
        await this.notificationsService.queueEstimateSent(
          estimate.tenantId,
          workOrder.customerId,
          estimate.id,
          estimate.total
        );
      }
    }

    this.realtimeService.emitToTenant(estimate.tenantId, 'estimate.updated', estimate);

    return estimate;
  }

  async handleCustomerApproval(id: string, dto: ApproveEstimateDto, userId?: string, ipAddress?: string) {
    // We use a Prisma transaction to ensure all checks and updates happen atomically
    return this.prisma.extended.$transaction(async (tx) => {
      const estimate = await tx.estimate.findUnique({
        where: { id },
        include: { workOrder: true },
      });

      if (!estimate) {
        throw new NotFoundException('Estimate not found');
      }

      // Check if already approved/rejected to make it idempotent/safe against duplicate requests
      if (estimate.status === EstimateStatus.APPROVED || estimate.status === EstimateStatus.REJECTED) {
        return estimate; // Return early, it's already done
      }

      // Ensure the estimate is in a state where it can be approved
      if (estimate.status !== EstimateStatus.SENT && estimate.status !== EstimateStatus.VIEWED) {
        throw new BadRequestException(`Estimate cannot be approved in state: ${estimate.status}`);
      }

      const newStatus = dto.approved ? EstimateStatus.APPROVED : EstimateStatus.REJECTED;

      // 1. Update the Estimate Status
      const updatedEstimate = await tx.estimate.update({
        where: { id },
        data: { status: newStatus },
      });

      // 2. If approved, automatically transition the Work Order to APPROVED (if it's in WAITING_FOR_APPROVAL)
      if (dto.approved && estimate.workOrder.status === WorkOrderStatus.WAITING_FOR_APPROVAL) {
        await tx.workOrder.update({
          where: { id: estimate.workOrderId },
          data: { status: WorkOrderStatus.APPROVED },
        });

        await tx.workOrderTimelineEvent.create({
          data: {
            workOrderId: estimate.workOrderId,
            tenantId: estimate.tenantId,
            userId,
            type: 'STATUS_CHANGE',
            details: { 
              from: WorkOrderStatus.WAITING_FOR_APPROVAL, 
              to: WorkOrderStatus.APPROVED,
              note: 'Customer automatically approved via Estimate',
            },
          },
        });
      }

      return updatedEstimate;
    }).then(async (updatedEstimate) => {
      // 3. Create Audit Record (outside transaction to guarantee it logs regardless if it's the same system)
      await this.auditService.logEvent({
        action: dto.approved ? 'ESTIMATE_APPROVED' : 'ESTIMATE_REJECTED',
        userId,
        tenantId: this.cls.get('tenantId'),
        ipAddress,
        details: { estimateId: id },
      });

      if (dto.approved) {
        await this.notificationsService.queueEstimateApproved(
          updatedEstimate.tenantId,
          (updatedEstimate as any).workOrder?.customerId, // Fetched in transaction
          updatedEstimate.id
        );
      }

      this.realtimeService.emitToTenant(updatedEstimate.tenantId, 'estimate.updated', updatedEstimate);

      return updatedEstimate;
    });
  }
}
