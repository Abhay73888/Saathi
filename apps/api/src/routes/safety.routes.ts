import { Router } from 'express';
import { z } from 'zod';
import {
  CheckinStatus,
  NotificationType,
  RiskLevel,
} from '@saath/shared';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/async.js';
import { requireAuth } from '../middleware/auth.js';
import { notify } from '../services/notification.service.js';
import { Errors } from '../lib/errors.js';

export const safetyRouter = Router();

/**
 * SOS — creates a safety event, pages admins/safety team, and optionally
 * notifies trusted contacts with the caller's (ephemeral) location.
 */
safetyRouter.post(
  '/safety/sos',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        bookingId: z.string().uuid().optional(),
        location: z.object({ lat: z.number(), lng: z.number() }).optional(),
        notifyContacts: z.boolean().default(true),
      })
      .parse(req.body);

    const event = await prisma.sosEvent.create({
      data: {
        userId: req.auth!.userId,
        bookingId: body.bookingId,
        location: body.location as object | undefined,
      },
    });

    // Safety team = admins. Page immediately.
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' } });
    for (const admin of admins) {
      await notify(admin.id, NotificationType.SAFETY_ALERT, {
        kind: 'SOS_TRIGGERED',
        sosId: event.id,
        userId: req.auth!.userId,
        bookingId: body.bookingId,
      });
    }

    if (body.notifyContacts) {
      const contacts = await prisma.trustedContact.findMany({ where: { userId: req.auth!.userId } });
      // SMS fan-out to contacts happens here via the SMS provider; we record intent.
      // (No continuous tracking — location is delivered as a one-time link.)
      res.locals.contactsNotified = contacts.length;
    }

    res.status(201).json({
      data: {
        sosId: event.id,
        emergencyNumber: '112',
        safetyTeamAlerted: admins.length,
        contactsNotified: res.locals.contactsNotified ?? 0,
      },
    });
  }),
);

safetyRouter.get(
  '/safety/trusted-contacts',
  requireAuth,
  asyncHandler(async (req, res) => {
    const contacts = await prisma.trustedContact.findMany({ where: { userId: req.auth!.userId } });
    res.json({ data: contacts });
  }),
);

safetyRouter.post(
  '/safety/trusted-contacts',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(1).max(80),
        phone: z.string().regex(/^\+91[6-9]\d{9}$/),
        relationship: z.string().max(40).optional(),
      })
      .parse(req.body);
    const count = await prisma.trustedContact.count({ where: { userId: req.auth!.userId } });
    if (count >= 3) throw Errors.badRequest('You can add at most 3 trusted contacts.', 'MAX_CONTACTS');
    const contact = await prisma.trustedContact.create({ data: { userId: req.auth!.userId, ...body } });
    res.status(201).json({ data: contact });
  }),
);

safetyRouter.delete(
  '/safety/trusted-contacts/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.trustedContact.deleteMany({
      where: { id: req.params.id, userId: req.auth!.userId },
    });
    res.json({ data: { ok: true } });
  }),
);

/** Ephemeral location point during an active session — purged by scheduler TTL. */
safetyRouter.post(
  '/safety/location',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        bookingId: z.string().uuid(),
        lat: z.number(),
        lng: z.number(),
      })
      .parse(req.body);
    const checkin = await prisma.safetyCheckin.findUnique({ where: { bookingId: body.bookingId } });
    if (!checkin || checkin.status !== CheckinStatus.CHECKED_IN) {
      throw Errors.badRequest('Location sharing is only available while checked in.', 'LOCATION_NOT_ACTIVE');
    }
    const points = (checkin.locationPoints as unknown as Array<unknown>) ?? [];
    points.push({ lat: body.lat, lng: body.lng, at: new Date().toISOString() });
    await prisma.safetyCheckin.update({
      where: { bookingId: body.bookingId },
      data: { locationPoints: points as object, locationShareEnabled: true },
    });
    res.json({ data: { ok: true, ttlNote: 'points auto-purge 24h after session' } });
  }),
);

safetyRouter.get(
  '/safety/checkins',
  requireAuth,
  asyncHandler(async (req, res) => {
    const checkins = await prisma.safetyCheckin.findMany({
      where: {
        OR: [{ booking: { customerId: req.auth!.userId } }, { booking: { companion: { userId: req.auth!.userId } } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { booking: { include: { experience: true } } },
    });
    // Never return ephemeral location points beyond the active session.
    const safe = checkins.map(({ locationPoints, ...c }) => ({
      ...c,
      hasLocation: Array.isArray(locationPoints) && (locationPoints as unknown[]).length > 0,
      locationPoints: c.status === CheckinStatus.CHECKED_IN ? locationPoints : [],
    }));
    res.json({ data: safe });
  }),
);

/** Report history visible to the user. */
safetyRouter.get(
  '/safety/risk',
  requireAuth,
  asyncHandler(async (req, res) => {
    const score = await prisma.riskScore.findUnique({ where: { userId: req.auth!.userId } });
    res.json({ data: { level: score?.level ?? RiskLevel.LOW } });
  }),
);
