import { Router } from 'express';
import { reviewSchema } from '@saath/shared';
import type { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/async.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { submitReview } from '../services/review.service.js';
import { ModerationStatus } from '@saath/shared';

export const reviewsRouter = Router();

reviewsRouter.post(
  '/reviews',
  requireAuth,
  validateBody(reviewSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof reviewSchema>;
    const review = await submitReview({ ...body, customerId: req.auth!.userId });
    res.status(201).json({ data: review });
  }),
);

reviewsRouter.get(
  '/reviews',
  asyncHandler(async (req, res) => {
    const companionProfileId = req.query.companionId as string | undefined;
    const reviews = await prisma.review.findMany({
      where: {
        ...(companionProfileId ? { companionProfileId, status: ModerationStatus.CLEARED } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ data: reviews });
  }),
);
