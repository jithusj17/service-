import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

interface CreateAuditEventDto {
  action: string;
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logEvent(data: CreateAuditEventDto): Promise<void> {
    try {
      await this.prisma.auditEvent.create({
        data: {
          action: data.action,
          userId: data.userId,
          tenantId: data.tenantId,
          ipAddress: data.ipAddress,
          details: (data.details as Prisma.InputJsonValue) || {},
        },
      });
      this.logger.log(`Audit Event: ${data.action} by User ${data.userId || 'Unknown'}`);
    } catch (error) {
      this.logger.error('Failed to write audit event', error);
      // We do not throw here to prevent audit logging failures from breaking auth flows
    }
  }
}
