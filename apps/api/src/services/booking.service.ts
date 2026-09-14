import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import {
  BookingStatus,
  NotificationType,
  calculatePrice,
  refundPercentForCancellation,
} from '@saath/shared';
import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import { getSettings } from './settings.service.js';
import { assertWindowAvailable } from './availability.service.js';
import { creditBookingEarnings, reversePendingEarnings } from './wallet.service.js';
import { getPaymentProvider } from './payments/payment.provider.js';
import { notify } from './notification.service.js';
import { recordAudit } from './audit.service.js';
import type { Request } from 'express';

export interface BookingCreateInput {
  customerId: string;
  companionId: string;
  experienceId: string;
  startAt: Date;
  durationMinutes: number;
  meetingType: 'IN_PERSON' | 'ONLINE';
  meetingArea?: string;
  note?: string;
}

const ACTIVE_BOOKING_STATUSES = [
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.PENDING_PAYMENT,
] as const;

export async function createBooking(input: BookingCreateInput) {
  if (input.customerId === undefined) throw Errors.badRequest('customer required');

  const companion = await prisma.companionProfile.findUnique({
    where: { id: input.companionId },
    include: { services: { where: { experienceId: input.experienceId, isActive: true } } },
  });
  if (!companion || !companion.isLive) throw Errors.notFound('Companion');
  if (companion.userId === input.customerId) {
    throw Errors.badRequest('You cannot book yourself.', 'SELF_BOOKING');
  }
  const service = companion.services[0];
  if (!service) throw Errors.badRequest('This experience is not offered.', 'EXPERIENCE_UNAVAILABLE');

  const endAt = new Date(input.startAt.getTime() + input.durationMinutes * 60_000);

  // Authoritative backend availability check.
  const available = await assertWindowAvailable(
    input.companionId,
    input.startAt,
    endAt,
    input.durationMinutes,
  );
  if (!available) throw Errors.slotUnavailable();

  const settings = await getSettings();
  // HOURLY: partial hours round UP (you're booking the full hour slot);
  // SESSION: flat rate regardless of duration.
  const basePaise =
    service.pricingModel === 'HOURLY'
      ? service.ratePaise * BigInt(Math.max(1, Math.ceil(input.durationMinutes / 60)))
      : service.ratePaise;

  const price = calculatePrice(basePaise, {
    companionCommissionPercent: settings.companionCommissionPercent,
    taxPercent: settings.taxPercent,
    minBookingPaise: settings.minBookingPaise,
  });

  const idempotencyKey = randomUUID();

  try {
    const booking = await prisma.booking.create({
      data: {
        customerId: input.customerId,
        companionProfileId: input.companionId,
        experienceId: input.experienceId,
        startAt: input.startAt,
        endAt,
        durationMinutes: input.durationMinutes,
        meetingType: input.meetingType,
        meetingArea: input.meetingArea,
        note: input.note,
        status: BookingStatus.REQUESTED,
        basePaise: price.basePaise,
        commissionPaise: price.commissionPaise,
        taxPaise: price.taxPaise,
        totalPaise: price.totalPaise,
        companionCreditPaise: price.companionCreditPaise,
        idempotencyKey,
      },
    });

    // Booking-linked conversation.
    const conversation = await prisma.conversation.create({
      data: {
        bookingId: booking.id,
        contextType: 'BOOKING',
        participants: {
          create: [{ userId: input.customerId }, { userId: companion.userId }],
        },
      },
    });
    await prisma.safetyCheckin.create({ data: { bookingId: booking.id, companionProfileId: input.companionId } });

    await notify(companion.userId, NotificationType.BOOKING_REQUESTED, {
      bookingId: booking.id,
      startAt: booking.startAt,
    });
    return { booking, conversation };
  } catch (e) {
    // The DB EXCLUDE constraint double-booking guard (authoritative).
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw Errors.slotUnavailable();
    }
    throw e;
  }
}

export async function respondToBooking(
  bookingId: string,
  actorId: string,
  accept: boolean,
  req?: Request,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { companion: true },
  });
  if (!booking) throw Errors.notFound('Booking');
  if (booking.companion.userId !== actorId) throw Errors.forbidden();
  if (booking.status !== BookingStatus.REQUESTED) {
    throw Errors.conflict('This request has already been handled.', 'BOOKING_NOT_OPEN');
  }

  const settings = await getSettings();
  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({
      where: { id: bookingId },
      data: accept
        ? {
            status: BookingStatus.PENDING_PAYMENT,
            acceptedAt: new Date(),
            paymentExpiresAt: new Date(Date.now() + settings.paymentWindowMinutes * 60_000),
          }
        : { status: BookingStatus.CANCELLED, cancellationReason: 'Declined by companion' },
    });
    await recordAudit({
      actorId,
      action: accept ? 'BOOKING_ACCEPTED' : 'BOOKING_REJECTED',
      targetType: 'BOOKING',
      targetId: bookingId,
      after: { status: b.status },
      req,
    });
    return b;
  });

  await notify(booking.customerId, accept ? NotificationType.BOOKING_ACCEPTED : NotificationType.BOOKING_REJECTED, {
    bookingId,
  });
  return updated;
}

/** Create a payment order (server-side, post re-validation). Client never sets amount. */
export async function createPaymentOrder(bookingId: string, actorId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw Errors.notFound('Booking');
  if (booking.customerId !== actorId) throw Errors.forbidden();
  if (booking.status !== BookingStatus.PENDING_PAYMENT) {
    throw Errors.conflict('This booking is not awaiting payment.', 'BOOKING_NOT_PAYABLE');
  }
  if (booking.paymentExpiresAt && booking.paymentExpiresAt < new Date()) {
    throw Errors.conflict('The payment window has expired. Please request again.', 'PAYMENT_WINDOW_EXPIRED');
  }

  const endAt = new Date(booking.startAt.getTime() + booking.durationMinutes * 60_000);
  const available = await assertWindowAvailable(
    booking.companionProfileId,
    booking.startAt,
    endAt,
    booking.durationMinutes,
    booking.id, // exclude this booking itself from the busy list
  );
  if (!available) throw Errors.slotUnavailable();

  const provider = await getPaymentProvider();
  const order = await provider.createOrder({
    amountPaise: Number(booking.totalPaise),
    receipt: booking.id,
    notes: { bookingId: booking.id },
  });

  const payment = await prisma.payment.upsert({
    where: { idempotencyKey: booking.id },
    create: {
      bookingId: booking.id,
      provider: provider.name,
      providerOrderId: order.orderId,
      amountPaise: booking.totalPaise,
      status: 'CREATED',
      idempotencyKey: booking.id,
    },
    update: { providerOrderId: order.orderId, status: 'PENDING' },
  });

  return { order, payment };
}

/**
 * Idempotent payment confirmation. Called ONLY from a signature-verified
 * webhook (or the mock provider test helper). Capturing confirms the booking
 * and posts companion earnings to the ledger.
 */
export async function confirmPayment(
  providerOrderId: string,
  providerPaymentId: string,
  webhookEventId: string,
) {
  // Idempotency: if this payment was already captured, no-op.
  const already = await prisma.payment.findFirst({
    where: { providerPaymentId, status: 'CAPTURED' },
  });
  if (already) return { alreadyProcessed: true };
  void webhookEventId;

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: { providerOrderId },
      include: { booking: { include: { companion: true } } },
    });
    if (!payment) throw Errors.notFound('Payment');
    if (payment.status === 'CAPTURED') return { alreadyProcessed: true };

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'CAPTURED',
        providerPaymentId,
        capturedAt: new Date(),
        webhookEvents: [...((payment.webhookEvents as string[]) ?? []), webhookEventId] as Prisma.InputJsonValue,
      },
    });

    const booking = await tx.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.CONFIRMED },
      include: { companion: true },
    });

    await creditBookingEarnings(tx, {
      userId: booking.companion.userId,
      amountPaise: booking.companionCreditPaise,
      bookingId: booking.id,
    });

    await notify(booking.customerId, NotificationType.PAYMENT_SUCCESS, { bookingId: booking.id });
    await notify(booking.companion.userId, NotificationType.PAYMENT_SUCCESS, { bookingId: booking.id });
    return { alreadyProcessed: false, booking };
  });
}

export async function failPayment(providerOrderId: string, webhookEventId: string) {
  await prisma.payment.updateMany({
    where: { providerOrderId, status: { in: ['CREATED', 'PENDING'] } },
    data: { status: 'FAILED', webhookEvents: [webhookEventId] as Prisma.InputJsonValue },
  });
}

export async function cancelBooking(bookingId: string, actorId: string, reason: string, isAdmin = false) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { companion: true, payments: true },
  });
  if (!booking) throw Errors.notFound('Booking');
  const isCustomer = booking.customerId === actorId;
  const isCompanion = booking.companion.userId === actorId;
  if (!isCustomer && !isCompanion && !isAdmin) throw Errors.forbidden();
  const terminal: BookingStatus[] = [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.REFUNDED];
  if (terminal.includes(booking.status)) {
    throw Errors.conflict('This booking can no longer be cancelled.', 'BOOKING_TERMINAL');
  }

  const settings = await getSettings();
  const captured = booking.payments.find((p) => p.status === 'CAPTURED' || p.status === 'REFUNDED' || p.status === 'PARTIALLY_REFUNDED');
  const refundPct = captured ? refundPercentForCancellation(booking.startAt, new Date(), settings.cancellationTiers) : 0;

  const result = await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: refundPct === 100 ? BookingStatus.REFUNDED : BookingStatus.CANCELLED,
        cancellationReason: reason,
        cancelledById: actorId,
      },
    });

    let refundAmount = 0n;
    if (captured && refundPct > 0) {
      refundAmount = (booking.totalPaise * BigInt(refundPct)) / 100n;
      const provider = await getPaymentProvider();
      const { providerRefundId } = await provider.refund({
        providerPaymentId: captured.providerPaymentId ?? 'mock',
        amountPaise: Number(refundAmount),
        reason,
      });
      await tx.refund.create({
        data: {
          paymentId: captured.id,
          bookingId,
          amountPaise: refundAmount,
          reason,
          status: 'PROCESSED',
          providerRefundId,
          initiatedById: actorId,
          processedAt: new Date(),
        },
      });
      await tx.payment.update({
        where: { id: captured.id },
        data: { status: refundPct === 100 ? 'REFUNDED' : 'PARTIALLY_REFUNDED' },
      });
      // Reverse companion earnings (they were pending unless completed).
      const companionShareToReverse = (booking.companionCreditPaise * BigInt(refundPct)) / 100n;
      await reversePendingEarnings(tx, {
        userId: booking.companion.userId,
        amountPaise: companionShareToReverse,
        bookingId,
      });
    }
    return { refundAmount, refundPct };
  });

  await notify(booking.customerId, NotificationType.REFUND_PROCESSED, {
    bookingId,
    refundPaise: Number(result.refundAmount),
    refundPct: result.refundPct,
  });
  return result;
}

/** Scheduler: auto-complete confirmed bookings whose session + grace period has passed. */
export async function autoCompleteBookings(): Promise<number> {
  const due = await prisma.booking.findMany({
    where: {
      status: BookingStatus.CONFIRMED,
      endAt: { lt: new Date(Date.now() - 2 * 3600_000) },
    },
  });
  for (const b of due) {
    await prisma.booking.update({
      where: { id: b.id },
      data: { status: BookingStatus.COMPLETED, completedAt: new Date() },
    });
  }
  return due.length;
}

/** Scheduler: expire unpaid PENDING_PAYMENT bookings after the payment window. */
export async function expireUnpaidBookings(): Promise<number> {
  const res = await prisma.booking.updateMany({
    where: {
      status: BookingStatus.PENDING_PAYMENT,
      paymentExpiresAt: { lt: new Date() },
    },
    data: { status: BookingStatus.CANCELLED, cancellationReason: 'Payment window expired' },
  });
  return res.count;
}
