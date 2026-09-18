import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RealtimeService } from './realtime.service';

@Injectable()
export class RealtimeListener {
  private readonly logger = new Logger(RealtimeListener.name);

  constructor(private readonly realtimeService: RealtimeService) {}

  @OnEvent('workOrder.updated')
  handleWorkOrderUpdated(payload: any) {
    if (payload.tenantId) {
      this.realtimeService.emitToTenant(payload.tenantId, 'workOrder.updated', payload);
      this.logger.debug(`Emitted workOrder.updated for tenant ${payload.tenantId}`);
    }
  }

  @OnEvent('estimate.updated')
  handleEstimateUpdated(payload: any) {
    if (payload.tenantId) {
      this.realtimeService.emitToTenant(payload.tenantId, 'estimate.updated', payload);
      this.logger.debug(`Emitted estimate.updated for tenant ${payload.tenantId}`);
    }
  }

  @OnEvent('notification.created')
  handleNotificationCreated(payload: any) {
    if (payload.tenantId) {
      this.realtimeService.emitToTenant(payload.tenantId, 'notification.created', payload);
      this.logger.debug(`Emitted notification.created for tenant ${payload.tenantId}`);
    }
  }

  @OnEvent('payment.received')
  handlePaymentReceived(payload: any) {
    if (payload.tenantId) {
      this.realtimeService.emitToTenant(payload.tenantId, 'payment.received', payload);
      this.logger.debug(`Emitted payment.received for tenant ${payload.tenantId}`);
    }
  }
}
