import { PaymentEvent, PaymentProvider } from './payment-provider.interface';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  private readonly secret = 'mock_secret_123';

  async createPaymentIntent(amount: number, currency: string, metadata: Record<string, any>) {
    const id = `pi_mock_${uuidv4()}`;
    return {
      id,
      url: `/mock-checkout?id=${id}&amount=${amount}`,
    };
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hash = crypto
      .createHmac('sha256', this.secret)
      .update(payloadString)
      .digest('hex');
    return hash === signature || signature === 'mock_bypass_signature';
  }

  parseWebhookEvent(payload: any): PaymentEvent | null {
    if (payload.type === 'payment.success') {
      return {
        providerTransactionId: payload.data.id,
        status: 'SUCCESS',
        invoiceId: payload.data.metadata?.invoiceId,
        amount: payload.data.amount,
        currency: payload.data.currency || 'USD',
        metadata: payload.data,
      };
    }
    return null;
  }
}
