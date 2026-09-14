import { Router, raw } from 'express';
import { createHmac } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/async.js';
import { requireAuth } from '../middleware/auth.js';
import { limits } from '../middleware/rateLimit.js';
import { getPaymentProvider } from '../services/payments/payment.provider.js';
import { confirmPayment, failPayment } from '../services/booking.service.js';
import { Errors } from '../lib/errors.js';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';

export const paymentsRouter = Router();

/**
 * Razorpay-style webhook. The raw body is HMAC-verified with the webhook
 * secret — payment status is NEVER accepted from the browser. In mock mode
 * we verify the mock secret and expose a test trigger that signs the payload
 * the same way the real gateway would.
 */
paymentsRouter.post(
  '/payments/webhook',
  raw({ type: '*/*' }),
  asyncHandler(async (req, res) => {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body ?? '');
    const signature =
      (req.headers['x-razorpay-signature'] as string) ??
      (req.headers['x-webhook-signature'] as string) ??
      '';

    try {
      const provider = await getPaymentProvider();
      const event = provider.verifyWebhook(rawBody, signature);

      if (event.status === 'captured' && event.orderId && event.providerPaymentId) {
        const result = await confirmPayment(event.orderId, event.providerPaymentId, event.event + ':' + event.providerPaymentId);
        logger.info('payment.captured.webhook', { orderId: event.orderId, ...result });
      } else if (event.status === 'failed' && event.orderId) {
        await failPayment(event.orderId, event.event);
      }
      res.json({ received: true });
    } catch (err) {
      logger.warn('payment.webhook.invalid_signature', { message: (err as Error).message });
      res.status(400).json({ error: { code: 'INVALID_SIGNATURE', message: 'Webhook verification failed.' } });
    }
  }),
);

/**
 * DEV/TEST ONLY: simulate the gateway calling back with a signed
 * payment.captured event. Disabled in production.
 */
paymentsRouter.post(
  '/payments/mock-capture',
  limits.booking,
  asyncHandler(async (req, res) => {
    if (config.isProd || !config.payments.mock) {
      throw Errors.forbidden('Mock payments disabled.');
    }
    const { orderId } = z.object({ orderId: z.string() }).parse(req.body);
    const providerPaymentId = `pay_mock_${Date.now()}`;
    const payload = JSON.stringify({
      event: 'payment.captured',
      orderId,
      providerPaymentId,
    });
    const signature = createHmac('sha256', 'mock_webhook_secret').update(payload).digest('hex');

    const provider = await getPaymentProvider();
    const event = provider.verifyWebhook(payload, signature);
    if (event.status === 'captured') {
      await confirmPayment(orderId, providerPaymentId, 'mock:' + providerPaymentId);
    }
    res.json({ data: { ok: true, providerPaymentId } });
  }),
);

paymentsRouter.get(
  '/payments',
  requireAuth,
  asyncHandler(async (req, res) => {
    const payments = await prisma.payment.findMany({
      where: { booking: { customerId: req.auth!.userId } },
      orderBy: { createdAt: 'desc' },
      include: { refunds: true },
    });
    res.json({ data: payments });
  }),
);

paymentsRouter.get(
  '/payments/config',
  asyncHandler(async (_req, res) => {
    res.json({
      data: {
        mock: config.payments.mock,
        keyId: config.payments.mock ? 'mock_key' : config.payments.razorpayKeyId,
      },
    });
  }),
);
