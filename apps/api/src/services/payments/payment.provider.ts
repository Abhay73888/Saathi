import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Payment provider abstraction. The mock implementation simulates Razorpay
 * Orders/webhooks for local development and automated tests; the real
 * Razorpay adapter (same interface) is selected when PAYMENTS_MOCK=false.
 *
 * CRITICAL: payment status is NEVER trusted from the client — state changes
 * happen only through verifyWebhook with an HMAC-verified payload.
 */

export interface CreatedOrder {
  orderId: string;
  amountPaise: number;
  currency: string;
  status: string;
  checkoutInfo: Record<string, unknown>;
}

export interface WebhookResult {
  ok: boolean;
  event: string;
  providerPaymentId?: string;
  orderId?: string;
  status: 'captured' | 'failed' | 'refunded' | 'unknown';
}

export interface PaymentProvider {
  readonly name: string;
  createOrder(params: { amountPaise: number; receipt: string; notes?: Record<string, string> }): Promise<CreatedOrder>;
  /** Verifies provider signature and normalises the event. Throws on bad signature. */
  verifyWebhook(rawBody: string, signature: string): WebhookResult;
  refund(params: { providerPaymentId: string; amountPaise: number; reason: string }): Promise<{ providerRefundId: string }>;
  payout(params: { fundAccountId: string; amountPaise: number; reference: string }): Promise<{ providerRef: string }>;
}

export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';

  async createOrder({ amountPaise, receipt }: { amountPaise: number; receipt: string }): Promise<CreatedOrder> {
    return {
      orderId: `order_mock_${receipt}`,
      amountPaise,
      currency: 'INR',
      status: 'created',
      checkoutInfo: { mock: true },
    };
  }

  verifyWebhook(rawBody: string, signature: string): WebhookResult {
    // Mock "signature" = hex HMAC with secret 'mock_webhook_secret' (dev parity check).
    const expected = createHmac('sha256', 'mock_webhook_secret').update(rawBody).digest('hex');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new Error('invalid webhook signature');
    }
    const payload = JSON.parse(rawBody) as { event: string; orderId: string; providerPaymentId: string };
    const statusMap: Record<string, WebhookResult['status']> = {
      'payment.captured': 'captured',
      'payment.failed': 'failed',
      'refund.processed': 'refunded',
    };
    return {
      ok: true,
      event: payload.event,
      orderId: payload.orderId,
      providerPaymentId: payload.providerPaymentId,
      status: statusMap[payload.event] ?? 'unknown',
    };
  }

  async refund({ amountPaise }: { amountPaise: number }): Promise<{ providerRefundId: string }> {
    return { providerRefundId: `rfnd_mock_${Date.now()}_${amountPaise}` };
  }

  async payout({ reference }: { reference: string }): Promise<{ providerRef: string }> {
    return { providerRef: `payout_mock_${reference}` };
  }
}

import { config } from '../../config.js';
import { RazorpayPaymentProvider } from './razorpay.provider.js';

let provider: PaymentProvider | null = null;

export async function getPaymentProvider(): Promise<PaymentProvider> {
  if (provider) return provider;
  if (
    !config.payments.mock &&
    config.payments.razorpayKeyId &&
    config.payments.razorpayKeySecret
  ) {
    provider = new RazorpayPaymentProvider({
      keyId: config.payments.razorpayKeyId,
      keySecret: config.payments.razorpayKeySecret,
      webhookSecret: config.payments.webhookSecret,
    });
    return provider;
  }
  provider = new MockPaymentProvider();
  return provider;
}
