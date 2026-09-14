import { Router } from 'express';
import { payoutRequestSchema } from '@saath/shared';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/async.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { requestPayout } from '../services/wallet.service.js';
import { NotificationType } from '@saath/shared';
import { notify } from '../services/notification.service.js';
import { Errors } from '../lib/errors.js';

export const walletRouter = Router();

walletRouter.get(
  '/wallet',
  requireAuth,
  asyncHandler(async (req, res) => {
    const profile = await prisma.companionProfile.findUnique({ where: { userId: req.auth!.userId } });
    if (!profile) throw Errors.notFound('Wallet');
    const wallet = await prisma.wallet.upsert({
      where: { userId: req.auth!.userId },
      create: { userId: req.auth!.userId },
      update: {},
    });
    const transactions = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const payouts = await prisma.payout.findMany({
      where: { userId: req.auth!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      data: {
        pendingPaise: wallet.pendingPaise,
        availablePaise: wallet.availablePaise,
        withdrawnPaise: wallet.withdrawnPaise,
        transactions,
        payouts,
      },
    });
  }),
);

walletRouter.post(
  '/wallet/payouts',
  requireAuth,
  validateBody(payoutRequestSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof payoutRequestSchema>;
    const result = await requestPayout(req.auth!.userId, body.amountPaise, body.fundAccountId);
    await notify(req.auth!.userId, NotificationType.PAYOUT_UPDATE, {
      payoutId: result.id,
      status: result.status,
    });
    res.status(201).json({ data: { id: result.id, status: result.status } });
  }),
);

// Earnings dashboard data for companions.
walletRouter.get(
  '/earnings',
  requireAuth,
  asyncHandler(async (req, res) => {
    const profile = await prisma.companionProfile.findUniqueOrThrow({
      where: { userId: req.auth!.userId },
    });
    const [wallet, completed, confirmed] = await Promise.all([
      prisma.wallet.upsert({
        where: { userId: req.auth!.userId },
        create: { userId: req.auth!.userId },
        update: {},
      }),
      prisma.booking.count({
        where: { companionProfileId: profile.id, status: 'COMPLETED' },
      }),
      prisma.booking.count({
        where: { companionProfileId: profile.id, status: 'CONFIRMED' },
      }),
    ]);
    res.json({
      data: {
        availablePaise: wallet.availablePaise,
        pendingPaise: wallet.pendingPaise,
        withdrawnPaise: wallet.withdrawnPaise,
        completedBookings: completed,
        upcomingBookings: confirmed,
      },
    });
  }),
);
