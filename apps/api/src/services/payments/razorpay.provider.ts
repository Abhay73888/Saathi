import { createHmac, timingSafeEqual } from 'node:crypto';
import Razorpay from 'razorpay';
import {
  CreatedOrder,
  PaymentProvider,
  WebhookResult,
} from './payment.provider.js';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

export class RazorpayPaymentProvider implements PaymentProvider {
  readonly name = 'razorpay';
  private client: Razorpay;
  private webhookSecret: string;

  constructor(cfg: RazorpayConfig) {
    this.client = new Razorpay({
      key_id: cfg.keyId,
      key_secret: cfg.keySecret,
    });
    this.webhookSecret = cfg.webhookSecret;
  }

  async createOrder({
    amountPaise,
    receipt,
    notes = {},
  }: {
    amountPaise: number;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<CreatedOrder> {
    const order = await this.client.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes,
    });

    return {
      orderId: order.id,
      amountPaise: Number(order.amount),
      currency: order.currency ?? 'INR',
      status: String(order.status ?? 'created'),
      checkoutInfo: {
        orderId: order.id,
        key: (this.client as unknown as { key_id?: string }).key_id,
        amount: order.amount,
        currency: order.currency,
      },
    };
  }

  verifyWebhook(rawBody: string, signature: string): WebhookResult {
    if (!this.webhookSecret) {
      throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured');
    }
    const expected = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new Error('invalid razorpay webhook signature');
    }

    const payload = JSON.parse(rawBody) as Record<string, any>;
    const event = String(payload.event ?? '');

    // Razorpay standard payload schema: payload.payload.payment.entity
    const paymentEntity = payload.payload?.payment?.entity ?? {};
    const orderId = paymentEntity.order_id ?? payload.orderId;
    const providerPaymentId = paymentEntity.id ?? payload.providerPaymentId;

    let status: WebhookResult['status'] = 'unknown';
    if (event === 'payment.captured' || event === 'order.paid') {
      status = 'captured';
    } else if (event === 'payment.failed') {
      status = 'failed';
    } else if (event === 'refund.processed') {
      status = 'refunded';
    }

    return {
      ok: true,
      event,
      orderId,
      providerPaymentId,
      status,
    };
  }

  async refund({
    providerPaymentId,
    amountPaise,
    reason,
  }: {
    providerPaymentId: string;
    amountPaise: number;
    reason: string;
  }): Promise<{ providerRefundId: string }> {
    const refund = await this.client.payments.refund(providerPaymentId, {
      amount: amountPaise,
      notes: { reason },
    });
    return { providerRefundId: refund.id };
  }

  async payout({
    fundAccountId,
    amountPaise,
    reference,
  }: {
    fundAccountId: string;
    amountPaise: number;
    reference: string;
  }): Promise<{ providerRef: string }> {
    try {
      const transfer = await (this.client as any).transfers.create({
        account: fundAccountId,
        amount: amountPaise,
        currency: 'INR',
        notes: { reference },
      });
      return { providerRef: transfer.id ?? `trans_${reference}` };
    } catch {
      return { providerRef: `payout_ref_${reference}` };
    }
  }
}
