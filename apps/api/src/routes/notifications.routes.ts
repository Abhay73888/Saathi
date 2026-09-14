import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/async.js';
import { requireAuth } from '../middleware/auth.js';

export const notificationsRouter = Router();

notificationsRouter.get(
  '/notifications',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.auth!.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({ where: { userId: req.auth!.userId, readAt: null } }),
    ]);
    res.json({ data: items, meta: { unread } });
  }),
);

notificationsRouter.patch(
  '/notifications/:id/read',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.auth!.userId },
      data: { readAt: new Date() },
    });
    res.json({ data: { ok: true } });
  }),
);

notificationsRouter.post(
  '/notifications/read-all',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.auth!.userId, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ data: { ok: true } });
  }),
);

notificationsRouter.patch(
  '/profile',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        displayName: z.string().min(2).max(60).optional(),
        avatarKey: z.string().max(300).optional(),
        city: z.string().max(80).optional(),
        bio: z.string().max(500).optional(),
        interests: z.array(z.string().max(40)).max(20).optional(),
        visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
      })
      .parse(req.body);
    await prisma.customerProfile.update({ where: { userId: req.auth!.userId }, data: body });
    res.json({ data: { ok: true } });
  }),
);
