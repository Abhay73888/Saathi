import { Router } from 'express';
import { z } from 'zod';
import { VerificationStatus, NotificationType, UserRole } from '@saath/shared';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/async.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getIdvProvider } from '../services/idv.provider.js';
import { notify } from '../services/notification.service.js';
import { Errors } from '../lib/errors.js';
import { recordAudit } from '../services/audit.service.js';

export const verificationRouter = Router();

/**
 * Start identity verification. Production: redirects to the hosted IDV
 * provider (Hyperverge/Onfido). We never receive or store document images —
 * only a session reference.
 */
verificationRouter.post(
  '/verification/session',
  requireAuth,
  asyncHandler(async (req, res) => {
    const profile = await prisma.companionProfile.findUnique({ where: { userId: req.auth!.userId } });
    if (!profile) throw Errors.badRequest('Create a companion profile first.', 'NO_COMPANION_PROFILE');

    const provider = getIdvProvider();
    const session = await provider.createSession(req.auth!.userId);

    const request = await prisma.verificationRequest.create({
      data: {
        userId: req.auth!.userId,
        provider: 'mock',
        providerRef: session.sessionRef,
        status: VerificationStatus.SUBMITTED,
        expiresAt: new Date(Date.now() + 24 * 3600_000),
      },
    });
    res.json({ data: { sessionRef: session.sessionRef, redirectUrl: session.redirectUrl, requestId: request.id } });
  }),
);

verificationRouter.get(
  '/verification/status',
  requireAuth,
  asyncHandler(async (req, res) => {
    const latest = await prisma.verificationRequest.findFirst({
      where: { userId: req.auth!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      data: {
        status: latest?.status ?? VerificationStatus.NOT_STARTED,
        rejectionReason: latest?.rejectionReason ?? null,
      },
    });
  }),
);

/**
 * IDV provider webhook. In production this is signature-verified per the
 * provider's spec; the mock provider parses the hosted-flow result.
 */
verificationRouter.post(
  '/verification/webhook',
  asyncHandler(async (req, res) => {
    const provider = getIdvProvider();
    const result = provider.parseWebhook(req.body);
    const request = await prisma.verificationRequest.findFirst({
      where: { providerRef: result.sessionRef },
      orderBy: { createdAt: 'desc' },
    });
    if (!request) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown session' } });
      return;
    }

    if (result.passed && result.assertedAgeGte18 && result.faceMatch) {
      await prisma.verificationRequest.update({
        where: { id: request.id },
        data: {
          status: VerificationStatus.UNDER_REVIEW,
          assertedAgeGte18: true,
          faceMatch: true,
        },
      });
      // Auto-advance to VERIFIED in mock for dev; production waits for a human.
      await prisma.verificationRequest.update({
        where: { id: request.id },
        data: { status: VerificationStatus.VERIFIED, reviewedById: null },
      });
      await prisma.companionProfile.update({
        where: { userId: request.userId },
        data: { verificationStatus: VerificationStatus.VERIFIED },
      });
      await notify(request.userId, NotificationType.VERIFICATION_UPDATE, { status: 'VERIFIED' });
    } else {
      await prisma.verificationRequest.update({
        where: { id: request.id },
        data: {
          status: VerificationStatus.REJECTED,
          assertedAgeGte18: result.assertedAgeGte18,
          faceMatch: result.faceMatch,
          rejectionReason: result.rejectionReason ?? 'Verification failed. Please retry.',
        },
      });
      await prisma.companionProfile.update({
        where: { userId: request.userId },
        data: { verificationStatus: VerificationStatus.REJECTED },
      });
      await notify(request.userId, NotificationType.VERIFICATION_UPDATE, {
        status: 'REJECTED',
        reason: result.rejectionReason,
      });
    }
    res.json({ data: { ok: true } });
  }),
);

// Admin: list pending verification requests.
verificationRouter.get(
  '/admin/verifications',
  requireAuth,
  requireRole(UserRole.ADMIN),
  asyncHandler(async (_req, res) => {
    const requests = await prisma.verificationRequest.findMany({
      where: { status: { in: [VerificationStatus.SUBMITTED, VerificationStatus.UNDER_REVIEW] } },
      include: { user: { include: { companionProfile: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ data: requests });
  }),
);

verificationRouter.post(
  '/admin/verifications/:id/decide',
  requireAuth,
  requireRole(UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    const { approve, reason } = z
      .object({ approve: z.boolean(), reason: z.string().max(300).optional() })
      .parse(req.body);
    const request = await prisma.verificationRequest.findUnique({ where: { id: req.params.id } });
    if (!request) throw Errors.notFound('Verification request');

    await prisma.verificationRequest.update({
      where: { id: request.id },
      data: {
        status: approve ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED,
        rejectionReason: approve ? null : reason ?? 'Rejected by reviewer',
        reviewedById: req.auth!.userId,
      },
    });
    await prisma.companionProfile.update({
      where: { userId: request.userId },
      data: { verificationStatus: approve ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED },
    });
    await recordAudit({
      actorId: req.auth!.userId,
      action: approve ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
      targetType: 'VERIFICATION_REQUEST',
      targetId: request.id,
      after: { status: approve ? 'VERIFIED' : 'REJECTED' },
      req,
    });
    await notify(request.userId, NotificationType.VERIFICATION_UPDATE, {
      status: approve ? 'VERIFIED' : 'REJECTED',
      reason,
    });
    res.json({ data: { ok: true } });
  }),
);
