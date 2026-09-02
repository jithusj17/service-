import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaymentEvent } from './providers/payment-provider.interface';
import { Prisma, PaymentStatus, InvoiceStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async processWebhookEvent(event: PaymentEvent, provider: string, rawPayload: any) {
    if (!event.invoiceId) {
      throw new BadRequestException('Invoice ID missing from payment event');
    }

    // 1. Find the invoice and tenant
    const invoice = await this.prisma.extended.invoice.findUnique({
      where: { id: event.invoiceId },
    });

    if (!invoice) {
      throw new BadRequestException(`Invoice ${event.invoiceId} not found`);
    }

    // 2. Idempotency Check: Verify if this transaction was already processed
    const existingPayment = await this.prisma.extended.payment.findFirst({
      where: {
        providerTransactionId: event.providerTransactionId,
        provider,
      },
    });

    if (existingPayment && existingPayment.status === event.status) {
      // Duplicate webhook, already processed
      return { status: 'ignored', reason: 'duplicate' };
    }

    // 3. Process the payment in a transaction
    await this.prisma.extended.$transaction(async (tx) => {
      // Create or update the payment record
      if (existingPayment) {
        await tx.payment.update({
          where: { id: existingPayment.id },
          data: { status: event.status as PaymentStatus, metadata: event.metadata as Prisma.InputJsonValue },
        });
      } else {
        await tx.payment.create({
          data: {
            tenantId: invoice.tenantId,
            invoiceId: invoice.id,
            amount: event.amount || invoice.total,
            currency: event.currency || 'USD',
            provider,
            providerTransactionId: event.providerTransactionId,
            status: event.status as PaymentStatus,
            metadata: event.metadata as Prisma.InputJsonValue,
          },
        });
      }

      // Update invoice status if payment was successful
      if (event.status === 'SUCCESS') {
        const allPayments = await tx.payment.findMany({
          where: { invoiceId: invoice.id, status: 'SUCCESS' },
        });

        // Current event payment might not be returned in findMany if we just created it in this tx?
        // Wait, it is returned because we're in the same tx block.
        const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

        let newStatus: InvoiceStatus = invoice.status;
        if (totalPaid >= invoice.total) {
          newStatus = InvoiceStatus.PAID;
        } else if (totalPaid > 0) {
          newStatus = InvoiceStatus.PARTIALLY_PAID;
        }

        if (newStatus !== invoice.status) {
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: newStatus },
          });
        }
      }
    });

    // 4. Audit Log
    await this.auditService.logEvent({
      action: `PAYMENT_${event.status}`,
      tenantId: invoice.tenantId,
      details: {
        invoiceId: invoice.id,
        providerTransactionId: event.providerTransactionId,
        amount: event.amount,
      },
    });

    return { status: 'processed' };
  }
}
