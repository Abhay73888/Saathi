import { Router } from 'express';
import { z } from 'zod';
import { reportSchema, RiskLevel, ReportStatus } from '@saath/shared';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/async.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { recordRiskEvent } from '../services/risk.service.js';
import { notify } from '../services/notification.service.js';
import { NotificationType } from '@saath/shared';

export const socialRouter = Router();

// ---------------- Favorites ----------------

socialRouter.get(
  '/favorites',
  requireAuth,
  asyncHandler(async (req, res) => {
    const favs = await prisma.favorite.findMany({
      where: { customerId: req.auth!.userId },
      include: { companion: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      data: favs.map((f) => ({
        id: f.id,
        companion: {
          id: f.companion.id,
          displayName: f.companion.displayName,
          city: f.companion.city,
          ratingAvg: f.companion.ratingAvg,
          ratingCount: f.companion.ratingCount,
          avatarKey: f.companion.avatarKey,
        },
      })),
    });
  }),
);

// ---------------- Blocks ----------------

socialRouter.post(
  '/blocks',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { blockedId } = z.object({ blockedId: z.string().uuid() }).parse(req.body);
    if (blockedId === req.auth!.userId) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'You cannot block yourself.' } });
      return;
    }
    await prisma.block
      .create({ data: { blockerId: req.auth!.userId, blockedId } })
      .catch(() => undefined);
    res.status(201).json({ data: { blocked: true } });
  }),
);

socialRouter.get(
  '/blocks',
  requireAuth,
  asyncHandler(async (req, res) => {
    const blocks = await prisma.block.findMany({
      where: { blockerId: req.auth!.userId },
      include: { blocked: { include: { customerProfile: true, companionProfile: true } } },
    });
    res.json({
      data: blocks.map((b) => ({
        id: b.id,
        userId: b.blockedId,
        name: b.blocked.companionProfile?.displayName ?? b.blocked.customerProfile?.displayName ?? 'User',
      })),
    });
  }),
);

socialRouter.delete(
  '/blocks/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.block.deleteMany({
      where: { id: req.params.id, blockerId: req.auth!.userId },
    });
    res.json({ data: { blocked: false } });
  }),
);

// ---------------- Reports ----------------

socialRouter.post(
  '/reports',
  requireAuth,
  validateBody(reportSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof reportSchema>;
    // Risk-classify: threats/prohibited services jump straight to HIGH.
    const severe = ['THREAT', 'PROHIBITED_SERVICE', 'PAYMENT_FRAUD'].includes(body.reason);
    const report = await prisma.report.create({
      data: {
        reporterId: req.auth!.userId,
        reportedUserId: body.reportedUserId,
        refType: body.refType,
        refId: body.refId,
        reason: body.reason,
        details: body.details,
        status: ReportStatus.OPEN,
        riskLevel: severe ? RiskLevel.HIGH : RiskLevel.MEDIUM,
      },
    });
    if (body.reportedUserId) {
      await recordRiskEvent(body.reportedUserId, 'REPORT', { reason: body.reason, reportId: report.id });
    }
    // Page admins on HIGH risk reports.
    if (severe) {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' } });
      for (const admin of admins) {
        await notify(admin.id, NotificationType.SAFETY_ALERT, {
          kind: 'HIGH_RISK_REPORT',
          reportId: report.id,
          reason: body.reason,
        });
      }
    }
    res.status(201).json({ data: { id: report.id, status: report.status } });
  }),
);

socialRouter.get(
  '/reports',
  requireAuth,
  asyncHandler(async (req, res) => {
    const reports = await prisma.report.findMany({
      where: { reporterId: req.auth!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: reports });
  }),
);
