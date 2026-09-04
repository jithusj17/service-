import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { AssignWorkOrderDto } from './dto/assign-work-order.dto';
import { QueryWorkOrderDto } from './dto/query-work-order.dto';
import { AuditService } from '../audit/audit.service';
import { Prisma, WorkOrderStatus } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cls: ClsService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: RealtimeService,
  ) {}

  // Valid state transitions
  private readonly validTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
    [WorkOrderStatus.RECEIVED]: [WorkOrderStatus.DIAGNOSING, WorkOrderStatus.CANCELLED],
    [WorkOrderStatus.DIAGNOSING]: [WorkOrderStatus.WAITING_FOR_APPROVAL, WorkOrderStatus.APPROVED, WorkOrderStatus.CANCELLED],
    [WorkOrderStatus.WAITING_FOR_APPROVAL]: [WorkOrderStatus.APPROVED, WorkOrderStatus.CANCELLED],
    [WorkOrderStatus.APPROVED]: [WorkOrderStatus.WAITING_FOR_PARTS, WorkOrderStatus.IN_REPAIR, WorkOrderStatus.CANCELLED],
    [WorkOrderStatus.WAITING_FOR_PARTS]: [WorkOrderStatus.IN_REPAIR, WorkOrderStatus.CANCELLED],
    [WorkOrderStatus.IN_REPAIR]: [WorkOrderStatus.QUALITY_CHECK, WorkOrderStatus.CANCELLED],
    [WorkOrderStatus.QUALITY_CHECK]: [WorkOrderStatus.READY_FOR_PICKUP, WorkOrderStatus.IN_REPAIR, WorkOrderStatus.CANCELLED],
    [WorkOrderStatus.READY_FOR_PICKUP]: [WorkOrderStatus.COMPLETED],
    [WorkOrderStatus.COMPLETED]: [],
    [WorkOrderStatus.CANCELLED]: [],
  };

  private async generateWorkOrderNumber(): Promise<string> {
    const tenantId = this.cls.get('tenantId');
    const count = await this.prisma.extended.workOrder.count({
      where: { tenantId },
    });
    return `WO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }

  async create(dto: CreateWorkOrderDto, userId?: string, ipAddress?: string) {
    const workOrderNumber = await this.generateWorkOrderNumber();

    const workOrder = await this.prisma.extended.$transaction(async (tx) => {
      const wo = await tx.workOrder.create({
        data: {
          workOrderNumber,
          tenantId: this.cls.get('tenantId'),
          customerId: dto.customerId,
          assetId: dto.assetId,
          problem: dto.problem,
          priority: dto.priority,
          notes: dto.notes,
        },
      });

      await tx.workOrderTimelineEvent.create({
        data: {
          workOrderId: wo.id,
          tenantId: this.cls.get('tenantId'),
          userId,
          type: 'CREATED',
          details: { message: 'Work order created' },
        },
      });

      return wo;
    });

    await this.auditService.logEvent({
      action: 'WORK_ORDER_CREATED',
      userId,
      tenantId: this.cls.get('tenantId'),
      ipAddress,
      details: { workOrderId: workOrder.id, workOrderNumber },
    });

    this.realtimeService.emitToTenant(workOrder.tenantId, 'workOrder.updated', workOrder);

    return workOrder;
  }

  async findAll(query: QueryWorkOrderDto) {
    const { page = 1, limit = 10, search, customerId, assetId, technicianId, status, priority } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.WorkOrderWhereInput = {};

    if (customerId) where.customerId = customerId;
    if (assetId) where.assetId = assetId;
    if (technicianId) where.technicianId = technicianId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { workOrderNumber: { contains: search, mode: 'insensitive' } },
        { problem: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.extended.workOrder.count({ where }),
      this.prisma.extended.workOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          asset: true,
          customer: true,
          technician: {
            select: { id: true, name: true, email: true },
          },
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
    const workOrder = await this.prisma.extended.workOrder.findUnique({
      where: { id },
      include: {
        asset: true,
        customer: true,
        technician: {
          select: { id: true, name: true, email: true },
        },
        timeline: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundException('Work Order not found');
    }

    return workOrder;
  }

  async updateStatus(id: string, dto: UpdateWorkOrderStatusDto, userId?: string, ipAddress?: string) {
    const existing = await this.prisma.extended.workOrder.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Work Order not found');
    }

    if (existing.status === dto.status) {
      return existing; // No change
    }

    const allowedNextStates = this.validTransitions[existing.status];
    if (!allowedNextStates.includes(dto.status)) {
      throw new BadRequestException(`Invalid state transition from ${existing.status} to ${dto.status}`);
    }

    const updated = await this.prisma.extended.$transaction(async (tx) => {
      const wo = await tx.workOrder.update({
        where: { id },
        data: { status: dto.status },
      });

      await tx.workOrderTimelineEvent.create({
        data: {
          workOrderId: id,
          tenantId: this.cls.get('tenantId'),
          userId,
          type: 'STATUS_CHANGE',
          details: { 
            from: existing.status, 
            to: dto.status,
            note: dto.note,
          },
        },
      });

      return wo;
    });

    await this.auditService.logEvent({
      action: 'WORK_ORDER_STATUS_UPDATED',
      userId,
      tenantId: this.cls.get('tenantId'),
      ipAddress,
      details: { workOrderId: id, from: existing.status, to: dto.status },
    });

    await this.notificationsService.queueRepairStatusChanged(
      updated.tenantId,
      updated.customerId,
      updated.id,
      updated.status,
      updated.workOrderNumber
    );

    this.realtimeService.emitToTenant(updated.tenantId, 'workOrder.updated', updated);

    return updated;
  }

  async assignTechnician(id: string, dto: AssignWorkOrderDto, userId?: string, ipAddress?: string) {
    const existing = await this.prisma.extended.workOrder.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Work Order not found');
    }

    // Verify technician exists and belongs to tenant
    const technician = await this.prisma.extended.user.findUnique({
      where: { id: dto.technicianId },
    });

    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    const updated = await this.prisma.extended.$transaction(async (tx) => {
      const wo = await tx.workOrder.update({
        where: { id },
        data: { technicianId: dto.technicianId },
      });

      await tx.workOrderTimelineEvent.create({
        data: {
          workOrderId: id,
          tenantId: this.cls.get('tenantId'),
          userId,
          type: 'TECHNICIAN_ASSIGNED',
          details: { 
            technicianId: dto.technicianId,
            technicianName: technician.name,
            note: dto.note,
          },
        },
      });

      return wo;
    });

    await this.auditService.logEvent({
      action: 'WORK_ORDER_TECHNICIAN_ASSIGNED',
      userId,
      tenantId: this.cls.get('tenantId'),
      ipAddress,
      details: { workOrderId: id, technicianId: dto.technicianId },
    });

    this.realtimeService.emitToTenant(updated.tenantId, 'workOrder.updated', updated);

    return updated;
  }
}
