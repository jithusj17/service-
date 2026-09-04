import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '@service/shared';

import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
    private readonly realtimeService: RealtimeService,
  ) {}

  private async enqueue(jobName: string, data: any) {
    try {
      await this.notificationQueue.add(jobName, data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // 2s, 4s, 8s
        },
        removeOnComplete: true,
        removeOnFail: false,
      });
      this.logger.log(`Enqueued notification job: ${jobName}`);
      
      // Emit real-time event for UI updates
      if (data.tenantId) {
        this.realtimeService.emitToTenant(data.tenantId, 'notification.created', { jobName, data });
      }
    } catch (error) {
      this.logger.error(`Failed to enqueue notification job: ${jobName}`, error);
    }
  }

  async queueEstimateSent(tenantId: string, customerId: string, estimateId: string, total: number) {
    await this.enqueue('estimate.sent', {
      tenantId,
      customerId,
      estimateId,
      total,
      channels: ['EMAIL', 'IN_APP'],
    });
  }

  async queueEstimateApproved(tenantId: string, customerId: string, estimateId: string) {
    await this.enqueue('estimate.approved', {
      tenantId,
      customerId,
      estimateId,
      channels: ['IN_APP'],
    });
  }

  async queueRepairStatusChanged(tenantId: string, customerId: string, workOrderId: string, status: string, workOrderNumber: string) {
    await this.enqueue('repair.status_changed', {
      tenantId,
      customerId,
      workOrderId,
      workOrderNumber,
      status,
      channels: status === 'COMPLETED' ? ['EMAIL', 'IN_APP'] : ['IN_APP'],
    });
  }

  async queueInvoiceIssued(tenantId: string, customerId: string, invoiceId: string, invoiceNumber: string, total: number) {
    await this.enqueue('invoice.issued', {
      tenantId,
      customerId,
      invoiceId,
      invoiceNumber,
      total,
      channels: ['EMAIL', 'IN_APP'],
    });
  }

  async queuePaymentReceived(tenantId: string, customerId: string, invoiceId: string, amount: number) {
    await this.enqueue('payment.received', {
      tenantId,
      customerId,
      invoiceId,
      amount,
      channels: ['EMAIL', 'IN_APP'],
    });
  }
}
