import { Router } from 'express';
import { z } from 'zod';
import {
  UserRole,
  UserStatus,
  ReportStatus,
  PayoutStatus,
  ModerationStatus,
  DisputeStatus,
  DisputeResolution,
  RiskLevel,
  NotificationType,
} from '@saath/shared';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/async.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { recordAudit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';
import { processApprovedPayout } from '../services/wallet.service.js';
import { getSettings, updateSettings } from '../services/settings.service.js';
import { cancelBooking } from '../services/booking.service.js';
import { Errors } from '../lib/errors.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(UserRole.ADMIN));

// ---------------- Dashboard ----------------

adminRouter.get(
  '/admin/dashboard',
  asyncHandler(async (_req, res) => {
    const [
      totalUsers,
      activeUsers,
      verifiedCompanions,
      pendingVerifications,
      totalBookings,
      completedBookings,
      reportsOpen,
      disputesOpen,
      highRisk,
      paymentsAgg,
      refundsAgg,
      commissionAgg,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { status: UserStatus.ACTIVE, lastActiveAt: { gt: new Date(Date.now() - 30 * 86400e3) } } }),
      prisma.companionProfile.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.verificationRequest.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.report.count({ where: { status: { in: [ReportStatus.OPEN, ReportStatus.TRIAGED, ReportStatus.INVESTIGATING] } } }),
      prisma.dispute.count({ where: { status: DisputeStatus.OPEN } }),
      prisma.riskScore.count({ where: { level: RiskLevel.HIGH } }),
      prisma.payment.aggregate({ where: { status: 'CAPTURED' }, _sum: { amountPaise: true } }),
      prisma.refund.aggregate({ where: { status: 'PROCESSED' }, _sum: { amountPaise: true } }),
      prisma.booking.aggregate({ where: { status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] } }, _sum: { commissionPaise: true } }),
    ]);

    // Growth series (last 8 weeks).
    const since = new Date(Date.now() - 8 * 7 * 86400e3);
    const [newUsers, newBookings] = await Promise.all([
      prisma.user.groupBy({ by: ['createdAt'], where: { createdAt: { gte: since } }, _count: true }).catch(() => []),
      prisma.booking.groupBy({ by: ['createdAt'], where: { createdAt: { gte: since } }, _count: true }).catch(() => []),
    ]);

    res.json({
      data: {
        totalUsers,
        activeUsers,
        verifiedCompanions,
        pendingVerifications,
        totalBookings,
        completedBookings,
        reportsOpen,
        disputesOpen,
        highRiskAccounts: highRisk,
        revenuePaise: paymentsAgg._sum.amountPaise ?? 0n,
        refundsPaise: refundsAgg._sum.amountPaise ?? 0n,
        commissionPaise: commissionAgg._sum.commissionPaise ?? 0n,
        conversionRate: totalBookings ? completedBookings / totalBookings : 0,
        series: { newUsers, newBookings },
      },
    });
  }),
);

// ---------------- Users ----------------

adminRouter.get(
  '/admin/users',
  asyncHandler(async (req, res) => {
    const q = (req.query.q as string | undefined)?.trim();
    const status = req.query.status as UserStatus | undefined;
    const users = await prisma.user.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q } },
                { companionProfile: { displayName: { contains: q, mode: 'insensitive' } } },
                { customerProfile: { displayName: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        customerProfile: true,
        companionProfile: true,
        riskScore: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ data: users });
  }),
);

adminRouter.get(
  '/admin/users/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        customerProfile: true,
        companionProfile: true,
        riskScore: true,
        riskEvents: { orderBy: { createdAt: 'desc' }, take: 20 },
        verificationRequests: { orderBy: { createdAt: 'desc' }, take: 5 },
        reportsReceived: true,
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!user) throw Errors.notFound('User');
    res.json({ data: user });
  }),
);

const statusAction = z.object({ reason: z.string().min(3).max(300) });

async function setUserStatus(id: string, status: UserStatus, actorId: string, action: string, reason: string, req: Parameters<typeof recordAudit>[0]['req']) {
  const user = await prisma.user.update({ where: { id }, data: { status } });
  await recordAudit({ actorId, action, targetType: 'USER', targetId: id, after: { status }, req });
  await notify(id, NotificationType.SAFETY_ALERT, { kind: 'ACCOUNT_STATUS', status, reason });
  return user;
}

adminRouter.post(
  '/admin/users/:id/warn',
  asyncHandler(async (req, res) => {
    const { reason } = statusAction.parse(req.body);
    await notify(req.params.id, NotificationType.SAFETY_ALERT, { kind: 'WARNING', reason });
    await recordAudit({ actorId: req.auth!.userId, action: 'USER_WARNED', targetType: 'USER', targetId: req.params.id, after: { reason }, req });
    res.json({ data: { ok: true } });
  }),
);

adminRouter.post(
  '/admin/users/:id/suspend',
  asyncHandler(async (req, res) => {
    const { reason } = statusAction.parse(req.body);
    await setUserStatus(req.params.id, UserStatus.SUSPENDED, req.auth!.userId, 'USER_SUSPENDED', reason, req);
    res.json({ data: { ok: true } });
  }),
);

adminRouter.post(
  '/admin/users/:id/ban',
  asyncHandler(async (req, res) => {
    const { reason } = statusAction.parse(req.body);
    await setUserStatus(req.params.id, UserStatus.BANNED, req.auth!.userId, 'USER_BANNED', reason, req);
    res.json({ data: { ok: true } });
  }),
);

adminRouter.post(
  '/admin/users/:id/restore',
  asyncHandler(async (req, res) => {
    const { reason } = statusAction.parse(req.body);
    await setUserStatus(req.params.id, UserStatus.ACTIVE, req.auth!.userId, 'USER_RESTORED', reason, req);
    res.json({ data: { ok: true } });
  }),
);

// ---------------- Reports queue ----------------

adminRouter.get(
  '/admin/reports',
  asyncHandler(async (_req, res) => {
    const reports = await prisma.report.findMany({
      where: { status: { not: ReportStatus.DISMISSED } },
      orderBy: [{ riskLevel: 'desc' }, { createdAt: 'asc' }],
      include: {
        reporter: { include: { customerProfile: true } },
        reportedUser: { include: { customerProfile: true, companionProfile: true } },
      },
      take: 100,
    });
    res.json({ data: reports });
  }),
);

adminRouter.post(
  '/admin/reports/:id/decide',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        action: z.enum(['DISMISS', 'WARN', 'RESTRICT', 'CANCEL_BOOKING', 'SUSPEND', 'BAN']),
        note: z.string().max(500).optional(),
      })
      .parse(req.body);
    const report = await prisma.report.findUniqueOrThrow({ where: { id: req.params.id } });

    const actionMap: Record<string, string> = {
      DISMISS: 'REPORT_DISMISSED',
      WARN: 'USER_WARNED',
      RESTRICT: 'USER_RESTRICTED',
      CANCEL_BOOKING: 'BOOKING_CANCELLED_BY_ADMIN',
      SUSPEND: 'USER_SUSPENDED',
      BAN: 'USER_BANNED',
    };

    if (body.action === 'SUSPEND' && report.reportedUserId) {
      await setUserStatus(report.reportedUserId, UserStatus.SUSPENDED, req.auth!.userId, 'USER_SUSPENDED', body.note ?? report.reason, req);
    } else if (body.action === 'BAN' && report.reportedUserId) {
      await setUserStatus(report.reportedUserId, UserStatus.BANNED, req.auth!.userId, 'USER_BANNED', body.note ?? report.reason, req);
    }

    await prisma.report.update({
      where: { id: report.id },
      data: {
        status: ReportStatus.ACTIONED,
        actionTaken: body.action,
        resolution: body.note,
        assignedToId: req.auth!.userId,
        resolvedAt: new Date(),
      },
    });
    await recordAudit({
      actorId: req.auth!.userId,
      action: actionMap[body.action],
      targetType: 'REPORT',
      targetId: report.id,
      after: body,
      req,
    });
    res.json({ data: { ok: true } });
  }),
);

// ---------------- Flagged messages ----------------

adminRouter.get(
  '/admin/messages/flagged',
  asyncHandler(async (_req, res) => {
    const flags = await prisma.messageFlag.findMany({
      where: { resolvedAt: null },
      orderBy: [{ riskLevel: 'desc' }, { createdAt: 'asc' }],
      include: { message: { include: { sender: { include: { customerProfile: true, companionProfile: true } } } } },
      take: 100,
    });
    res.json({ data: flags });
  }),
);

adminRouter.post(
  '/admin/messages/:id/moderate',
  asyncHandler(async (req, res) => {
    const body = z.object({ resolution: z.enum(['DISMISSED', 'REMOVED', 'WARNING_SENT']) }).parse(req.body);
    await prisma.$transaction([
      prisma.messageFlag.updateMany({
        where: { messageId: req.params.id, resolvedAt: null },
        data: { resolution: body.resolution, reviewedById: req.auth!.userId, resolvedAt: new Date() },
      }),
      prisma.message.update({
        where: { id: req.params.id },
        data: { moderationStatus: body.resolution === 'REMOVED' ? ModerationStatus.REMOVED : ModerationStatus.FLAGGED },
      }),
    ]);
    await recordAudit({
      actorId: req.auth!.userId,
      action: `MESSAGE_${body.resolution}`,
      targetType: 'MESSAGE',
      targetId: req.params.id,
      req,
    });
    res.json({ data: { ok: true } });
  }),
);

// ---------------- Disputes ----------------

adminRouter.get(
  '/admin/disputes',
  asyncHandler(async (_req, res) => {
    const disputes = await prisma.dispute.findMany({
      where: { status: { not: DisputeStatus.RESOLVED } },
      include: { booking: { include: { payments: true, companion: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: disputes });
  }),
);

adminRouter.post(
  '/admin/disputes/:id/decide',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        resolution: z.nativeEnum(DisputeResolution),
        refundPercent: z.number().int().min(0).max(100).optional(),
        note: z.string().max(500).optional(),
      })
      .parse(req.body);
    const dispute = await prisma.dispute.findUniqueOrThrow({ where: { id: req.params.id }, include: { booking: true } });

    if (body.resolution === DisputeResolution.REFUND_FULL || body.resolution === DisputeResolution.REFUND_PARTIAL) {
      const pct = body.resolution === DisputeResolution.REFUND_FULL ? 100 : (body.refundPercent ?? 50);
      await cancelBooking(
        dispute.bookingId,
        req.auth!.userId,
        `Dispute resolved: ${body.note ?? 'admin decision'} (${pct}% refund)`,
        true,
      );
    }

    await prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        status: DisputeStatus.RESOLVED as 'RESOLVED',
        resolution: body.resolution as never,
        decidedById: req.auth!.userId,
        decidedAt: new Date(),
      },
    });
    await recordAudit({
      actorId: req.auth!.userId,
      action: 'DISPUTE_DECIDED',
      targetType: 'DISPUTE',
      targetId: dispute.id,
      after: body,
      req,
    });
    res.json({ data: { ok: true } });
  }),
);

// ---------------- Payouts ----------------

adminRouter.get(
  '/admin/payouts',
  asyncHandler(async (_req, res) => {
    const payouts = await prisma.payout.findMany({
      where: { status: { in: [PayoutStatus.UNDER_REVIEW, PayoutStatus.ON_HOLD, PayoutStatus.APPROVED] } },
      include: { user: { include: { companionProfile: true, riskScore: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ data: payouts });
  }),
);

adminRouter.post(
  '/admin/payouts/:id/approve',
  asyncHandler(async (req, res) => {
    const payout = await prisma.payout.findUniqueOrThrow({ where: { id: req.params.id } });
    await prisma.payout.update({
      where: { id: payout.id },
      data: { status: PayoutStatus.APPROVED, reviewedById: req.auth!.userId },
    });
    await processApprovedPayout(payout.id);
    await recordAudit({ actorId: req.auth!.userId, action: 'PAYOUT_APPROVED', targetType: 'PAYOUT', targetId: payout.id, req });
    await notify(payout.userId, NotificationType.PAYOUT_UPDATE, { payoutId: payout.id, status: 'COMPLETED' });
    res.json({ data: { ok: true } });
  }),
);

adminRouter.post(
  '/admin/payouts/:id/reject',
  asyncHandler(async (req, res) => {
    const { reason } = z.object({ reason: z.string().min(3).max(300) }).parse(req.body);
    const payout = await prisma.payout.findUniqueOrThrow({ where: { id: req.params.id } });
    // Return reserved funds to available balance.
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: payout.walletId },
        data: {
          availablePaise: { increment: payout.amountPaise },
          withdrawnPaise: { decrement: payout.amountPaise },
        },
      }),
      prisma.payout.update({
        where: { id: payout.id },
        data: { status: PayoutStatus.REJECTED, riskHoldReason: reason, reviewedById: req.auth!.userId },
      }),
    ]);
    await recordAudit({ actorId: req.auth!.userId, action: 'PAYOUT_REJECTED', targetType: 'PAYOUT', targetId: payout.id, after: { reason }, req });
    await notify(payout.userId, NotificationType.PAYOUT_UPDATE, { payoutId: payout.id, status: 'REJECTED', reason });
    res.json({ data: { ok: true } });
  }),
);

// ---------------- Settings ----------------

adminRouter.get(
  '/admin/settings',
  asyncHandler(async (_req, res) => {
    res.json({ data: await getSettings() });
  }),
);

adminRouter.put(
  '/admin/settings',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        companionCommissionPercent: z.number().min(0).max(50).optional(),
        taxPercent: z.number().min(0).max(30).optional(),
        payoutCooldownHours: z.number().int().min(0).max(1000).optional(),
        paymentWindowMinutes: z.number().int().min(5).max(1440).optional(),
        cancellationTiers: z
          .array(z.object({ hoursBefore: z.number(), refundPercent: z.number().int().min(0).max(100) }))
          .optional(),
      })
      .parse(req.body);
    const updated = await updateSettings(body as never, req.auth!.userId);
    await recordAudit({ actorId: req.auth!.userId, action: 'SETTINGS_UPDATED', targetType: 'PLATFORM_SETTINGS', targetId: 'platform', after: body, req });
    res.json({ data: updated });
  }),
);

// ---------------- Audit log ----------------

adminRouter.get(
  '/admin/audit-logs',
  asyncHandler(async (req, res) => {
    const targetType = req.query.targetType as string | undefined;
    const logs = await prisma.auditLog.findMany({
      where: targetType ? { targetType } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { actor: { include: { customerProfile: true } } },
    });
    res.json({ data: logs });
  }),
);
