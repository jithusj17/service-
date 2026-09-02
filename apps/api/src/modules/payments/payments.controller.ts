import { Controller, Post, Headers, Body, Param, Req, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly mockProvider: MockPaymentProvider,
  ) {}

  @Post('webhook/:provider')
  @ApiOperation({ summary: 'Handle payment provider webhooks' })
  async handleWebhook(
    @Param('provider') provider: string,
    @Headers('x-signature') signature: string,
    @Req() req: Request,
    @Body() body: any,
  ) {
    if (!signature) {
      throw new UnauthorizedException('Missing signature header');
    }

    let paymentProvider;
    if (provider === 'mock') {
      paymentProvider = this.mockProvider;
    } else {
      throw new BadRequestException(`Unsupported provider: ${provider}`);
    }

    // Verify signature
    const isValid = paymentProvider.verifyWebhookSignature(body, signature);
    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Parse event
    const event = paymentProvider.parseWebhookEvent(body);
    if (!event) {
      // Ignored event type
      return { received: true, ignored: true };
    }

    // Process
    return this.paymentsService.processWebhookEvent(event, provider, body);
  }
}
