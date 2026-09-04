import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
  ) {}

  async getDashboardMetrics() {
    const tenantId = this.cls.get('tenantId');

    const now = new Date();
    
    // Start of today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      repairsToday,
      repairsThisMonth,
      revenueResult,
      pendingEstimates,
      workOrderStatusCounts,
      technicianWorkloadData,
      popularPartsData,
    ] = await Promise.all([
      // Repairs today
      this.prisma.extended.workOrder.count({
        where: { tenantId, createdAt: { gte: startOfDay } },
      }),
      // Repairs this month
      this.prisma.extended.workOrder.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      // Revenue this month
      this.prisma.extended.payment.aggregate({
        _sum: { amount: true },
        where: { tenantId, status: 'SUCCESS', createdAt: { gte: startOfMonth } },
      }),
      // Pending estimates
      this.prisma.extended.estimate.count({
        where: { tenantId, status: { in: ['DRAFT', 'SENT', 'VIEWED'] } },
      }),
      // Work Order statuses (In Progress, Ready for Pickup, etc.)
      this.prisma.extended.workOrder.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: { tenantId },
      }),
      // Technician workload
      this.prisma.extended.workOrder.groupBy({
        by: ['technicianId'],
        _count: { _all: true },
        where: { tenantId, status: { notIn: ['COMPLETED', 'CANCELLED'] }, technicianId: { not: null } },
      }),
      // Popular parts
      this.prisma.extended.inventoryTransaction.groupBy({
        by: ['partId'],
        _sum: { quantity: true },
        where: { tenantId, type: 'USED_IN_REPAIR' },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    // Average repair time for completed work orders (Raw SQL)
    const avgRepairTimeResult = await this.prisma.extended.$queryRaw<{ avg_duration_seconds: number }[]>`
      SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))) as avg_duration_seconds
      FROM "work_orders"
      WHERE "tenantId" = ${tenantId} AND "status" = 'COMPLETED'
    `;
    const averageRepairTimeSeconds = avgRepairTimeResult[0]?.avg_duration_seconds || 0;

    // Low stock items (Raw SQL because Prisma can't compare two columns directly easily)
    const lowStockItems = await this.prisma.extended.$queryRaw<any[]>`
      SELECT id, name, "stockQuantity", "minStockQuantity"
      FROM "parts"
      WHERE "tenantId" = ${tenantId} AND "stockQuantity" <= "minStockQuantity"
      ORDER BY "stockQuantity" ASC
      LIMIT 10
    `;

    // Process aggregated data
    const revenue = revenueResult._sum.amount || 0;
    
    let repairsInProgress = 0;
    let readyForPickup = 0;
    workOrderStatusCounts.forEach(c => {
      if (['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_APPROVAL', 'APPROVED', 'WAITING_FOR_PARTS', 'IN_REPAIR', 'QUALITY_CHECK'].includes(c.status)) {
        repairsInProgress += c._count._all;
      }
      if (c.status === 'READY_FOR_PICKUP') {
        readyForPickup += c._count._all;
      }
    });

    // Resolve Technician names
    const technicianIds = technicianWorkloadData.map(t => t.technicianId as string);
    let technicianWorkload: any[] = [];
    if (technicianIds.length > 0) {
      const technicians = await this.prisma.extended.user.findMany({
        where: { id: { in: technicianIds } },
        select: { id: true, name: true },
      });
      technicianWorkload = technicianWorkloadData.map(t => {
        const tech = technicians.find(u => u.id === t.technicianId);
        return {
          id: t.technicianId,
          name: tech?.name || 'Unknown',
          count: t._count._all,
        };
      });
    }

    // Resolve Part names for popular parts
    const partIds = popularPartsData.map(p => p.partId);
    let popularParts: any[] = [];
    if (partIds.length > 0) {
      const parts = await this.prisma.extended.part.findMany({
        where: { id: { in: partIds } },
        select: { id: true, name: true },
      });
      popularParts = popularPartsData.map(p => {
        const part = parts.find(pt => pt.id === p.partId);
        return {
          id: p.partId,
          name: part?.name || 'Unknown',
          // Note: In InventoryTransaction, USED_IN_REPAIR might be recorded as a negative quantity,
          // so we take Math.abs or just flip it depending on how the system implements deductions.
          // Assuming it's recorded as negative:
          quantityUsed: Math.abs(p._sum.quantity || 0),
        };
      });
    }

    return {
      repairsToday,
      repairsThisMonth,
      revenue,
      pendingEstimates,
      repairsInProgress,
      readyForPickup,
      averageRepairTimeSeconds,
      technicianWorkload,
      popularParts,
      lowStockItems,
    };
  }
}
