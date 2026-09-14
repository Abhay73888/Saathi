import { Router } from 'express';
import { bookingCreateSchema, BookingStatus, computeMeetupPin } from '@saath/shared';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/async.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { limits } from '../middleware/rateLimit.js';
import {
  createBooking,
  respondToBooking,
  createPaymentOrder,
  cancelBooking,
} from '../services/booking.service.js';
import { Errors } from '../lib/errors.js';

export const bookingsRouter = Router();

const bookingInclude = {
  experience: true,
  companion: { include: { user: { select: { id: true, email: true } } } },
  payments: true,
  conversation: { select: { id: true } },
  checkin: true,
} as const;

bookingsRouter.post(
  '/bookings',
  requireAuth,
  limits.booking,
  validateBody(bookingCreateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof bookingCreateSchema>;
    const { booking, conversation } = await createBooking({
      customerId: req.auth!.userId,
      companionId: body.companionId,
      experienceId: body.experienceId,
      startAt: new Date(body.startAt),
      durationMinutes: body.durationMinutes,
      meetingType: body.meetingType,
      meetingArea: body.meetingArea,
      note: body.note,
    });
    res.status(201).json({ data: { ...booking, conversationId: conversation.id } });
  }),
);

bookingsRouter.get(
  '/bookings',
  requireAuth,
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const role = req.query.role as 'customer' | 'companion' | undefined;
    const profile = await prisma.companionProfile.findUnique({ where: { userId: req.auth!.userId } });

    const where: Record<string, unknown> = {};
    if (role === 'companion' && profile) where.companionProfileId = profile.id;
    else if (role === 'customer') where.customerId = req.auth!.userId;
    else where.OR = [{ customerId: req.auth!.userId }, ...(profile ? [{ companionProfileId: profile.id }] : [])];
    if (status) where.status = status;

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { startAt: 'desc' },
      take: 100,
      include: bookingInclude,
    });
    res.json({ data: bookings });
  }),
);

bookingsRouter.get(
  '/bookings/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: bookingInclude,
    });
    if (!booking) throw Errors.notFound('Booking');
    const isParticipant =
      booking.customerId === req.auth!.userId ||
      booking.companion.userId === req.auth!.userId ||
      req.auth!.role === 'ADMIN';
    if (!isParticipant) throw Errors.forbidden();

    const isCompanion = booking.companion.userId === req.auth!.userId;
    const meetupPin = (isCompanion || req.auth!.role === 'ADMIN') ? computeMeetupPin(booking.id) : undefined;
    res.json({ data: { ...booking, meetupPin } });
  }),
);

bookingsRouter.post(
  '/bookings/:id/accept',
  requireAuth,
  asyncHandler(async (req, res) => {
    const booking = await respondToBooking(req.params.id, req.auth!.userId, true, req);
    res.json({ data: booking });
  }),
);

bookingsRouter.post(
  '/bookings/:id/reject',
  requireAuth,
  asyncHandler(async (req, res) => {
    const booking = await respondToBooking(req.params.id, req.auth!.userId, false, req);
    res.json({ data: booking });
  }),
);

bookingsRouter.post(
  '/bookings/:id/payment-order',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await createPaymentOrder(req.params.id, req.auth!.userId);
    res.json({ data: result });
  }),
);

bookingsRouter.post(
  '/bookings/:id/cancel',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { reason } = z.object({ reason: z.string().min(3).max(300) }).parse(req.body);
    const result = await cancelBooking(req.params.id, req.auth!.userId, reason);
    res.json({ data: result });
  }),
);

bookingsRouter.post(
  '/bookings/:id/checkin',
  requireAuth,
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { companion: true },
    });
    if (booking.customerId !== req.auth!.userId && booking.companion.userId !== req.auth!.userId) {
      throw Errors.forbidden();
    }
    const checkinOk: BookingStatus[] = [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS];
    if (!checkinOk.includes(booking.status)) {
      throw Errors.conflict('You can check in once the booking is confirmed.', 'CHECKIN_NOT_READY');
    }

    const body = z.object({ pin: z.string().optional() }).parse(req.body ?? {});
    const isCustomer = booking.customerId === req.auth!.userId;
    const expectedPin = computeMeetupPin(booking.id);

    // If customer initiates in-person check-in, require the companion's 4-digit PIN
    if (booking.meetingType === 'IN_PERSON' && isCustomer) {
      if (!body.pin || body.pin.trim() !== expectedPin) {
        throw Errors.badRequest(
          'Invalid 4-digit Meetup PIN. Please ask your companion in person for their PIN.',
          'INVALID_MEETUP_PIN',
        );
      }
    }

    const updated = await prisma.$transaction([
      prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.IN_PROGRESS },
      }),
      prisma.safetyCheckin.update({
        where: { bookingId: booking.id },
        data: { status: 'CHECKED_IN', checkedInAt: new Date() },
      }),
    ]);
    res.json({ data: updated[0] });
  }),
);

bookingsRouter.post(
  '/bookings/:id/checkout',
  requireAuth,
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { companion: true },
    });
    if (booking.customerId !== req.auth!.userId && booking.companion.userId !== req.auth!.userId) {
      throw Errors.forbidden();
    }
    await prisma.safetyCheckin.update({
      where: { bookingId: booking.id },
      data: { status: 'CHECKED_OUT', checkedOutAt: new Date() },
    });
    res.json({ data: { ok: true } });
  }),
);

bookingsRouter.post(
  '/bookings/:id/dispute',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { reason } = z.object({ reason: z.string().min(10).max(1000) }).parse(req.body);
    const booking = await prisma.booking.findUniqueOrThrow({ where: { id: req.params.id } });
    if (booking.customerId !== req.auth!.userId) throw Errors.forbidden();
    const dispute = await prisma.dispute.create({
      data: { bookingId: req.params.id, openedById: req.auth!.userId, reason },
    });
    await prisma.booking.update({ where: { id: req.params.id }, data: { status: BookingStatus.DISPUTED } });
    res.status(201).json({ data: dispute });
  }),
);

bookingsRouter.post(
  '/bookings/:id/complete',
  requireAuth,
  asyncHandler(async (req, res) => {
    // Companions can confirm completion; also auto-completed by the scheduler.
    const profile = await prisma.companionProfile.findUnique({ where: { userId: req.auth!.userId } });
    const booking = await prisma.booking.findUniqueOrThrow({ where: { id: req.params.id } });
    if (!profile || booking.companionProfileId !== profile.id) throw Errors.forbidden();
    if (booking.status !== BookingStatus.IN_PROGRESS && booking.status !== BookingStatus.CONFIRMED) {
      throw Errors.conflict('Booking cannot be completed in its current state.', 'BOOKING_NOT_ACTIVE');
    }
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.COMPLETED, completedAt: new Date() },
    });
    res.json({ data: updated });
  }),
);
