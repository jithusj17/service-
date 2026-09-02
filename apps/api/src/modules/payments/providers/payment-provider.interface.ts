export interface PaymentEvent {
  providerTransactionId: string;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  metadata?: Record<string, any>;
  amount?: number;
  currency?: string;
  invoiceId: string;
}

export interface PaymentProvider {
  createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, any>
  ): Promise<{ id: string; clientSecret?: string; url?: string }>;
  
  verifyWebhookSignature(payload: any, signature: string): boolean;
  
  parseWebhookEvent(payload: any): PaymentEvent | null;
}
