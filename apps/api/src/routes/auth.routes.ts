import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { registerSchema, loginSchema, otpRequestSchema, otpVerifySchema, UserRole } from '@saath/shared';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/async.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { limits } from '../middleware/rateLimit.js';
import { hashPassword, verifyPassword } from '../services/password.service.js';
import {
  signAccessToken,
  issueRefreshToken,
  consumeRefreshToken,
  revokeAllForUser,
  refreshCookieName,
} from '../services/token.service.js';
import { issueOtp, verifyOtp } from '../services/otp.service.js';
import { notify } from '../services/notification.service.js';
import { NotificationType } from '@saath/shared';
import { Errors } from '../lib/errors.js';
import { config } from '../config.js';
import { recordRiskEvent } from '../services/risk.service.js';
import { recordAudit } from '../services/audit.service.js';

export const authRouter = Router();

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(refreshCookieName, token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    maxAge: config.jwt.refreshTtlDays * 86_400_000,
    path: '/api/v1/auth',
  });
}

authRouter.post(
  '/register',
  limits.auth,
  validateBody(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, displayName, phone, dateOfBirth } = req.body as z.infer<typeof registerSchema>;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existing) throw Errors.conflict('An account with this email or phone already exists.', 'ACCOUNT_EXISTS');

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        dateOfBirth: new Date(dateOfBirth),
        role: UserRole.CUSTOMER,
        customerProfile: { create: { displayName } },
      },
    });

    // Email verification token flow goes via email provider; mark issued.
    // For dev we auto-issue an OTP for phone verification next step.
    const access = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const { token, familyId, expiresAt } = issueRefreshToken(user.id);
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshHash: token.slice(0, 16),
        familyId,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        expiresAt,
      },
    });
    setRefreshCookie(res, token);

    res.status(201).json({
      data: {
        accessToken: access,
        user: { id: user.id, email: user.email, role: user.role },
        nextStep: 'verify_phone',
      },
    });
  }),
);

authRouter.post(
  '/login',
  limits.auth,
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await prisma.user.findUnique({ where: { email } });
    // Constant-time-ish: always run a verification to reduce user enumeration.
    const valid = user?.passwordHash
      ? await verifyPassword(user.passwordHash, password)
      : await verifyPassword('$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', password).catch(() => false);

    if (!user || !valid || user.status !== 'ACTIVE') {
      if (user) await recordRiskEvent(user.id, 'PAYMENT_FAILURE', { reason: 'login_failed' });
      throw Errors.unauthorized('Incorrect email or password.');
    }

    const access = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const { token, familyId, expiresAt } = issueRefreshToken(user.id);
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshHash: token.slice(0, 16),
        familyId,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        expiresAt,
      },
    });
    setRefreshCookie(res, token);
    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

    res.json({
      data: {
        accessToken: access,
        user: { id: user.id, email: user.email, role: user.role },
      },
    });
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[refreshCookieName] as string | undefined;
    if (!token) throw Errors.unauthorized();
    const result = await consumeRefreshToken(token);
    if (!result) {
      // Reuse of an already-consumed token → potential theft; revoke family.
      throw Errors.unauthorized('Session expired. Please sign in again.');
    }
    const user = await prisma.user.findUnique({ where: { id: result.userId } });
    if (!user || user.status !== 'ACTIVE') throw Errors.forbidden('Account not active.');
    const access = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const refreshed = issueRefreshToken(user.id);
    setRefreshCookie(res, refreshed.token);
    res.json({ data: { accessToken: access } });
  }),
);

authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie(refreshCookieName, { path: '/api/v1/auth' });
    res.json({ data: { ok: true } });
  }),
);

authRouter.post(
  '/logout-all',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await revokeAllForUser(req.auth!.userId);
    await prisma.session.updateMany({
      where: { userId: req.auth!.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await recordAudit({
      actorId: req.auth!.userId,
      action: 'LOGOUT_ALL_DEVICES',
      targetType: 'USER',
      targetId: req.auth!.userId,
      req,
    });
    res.clearCookie(refreshCookieName, { path: '/api/v1/auth' });
    res.json({ data: { ok: true } });
  }),
);

authRouter.post(
  '/otp/request',
  limits.otp,
  validateBody(otpRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.body as z.infer<typeof otpRequestSchema>;
    const { devCode } = await issueOtp(phone);
    // Dev convenience: in non-production the code is returned so tests/QA work.
    res.json({ data: { sent: true, ...(config.isProd ? {} : { devCode }) } });
  }),
);

authRouter.post(
  '/otp/verify',
  limits.otp,
  validateBody(otpVerifySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { phone, code } = req.body as z.infer<typeof otpVerifySchema>;
    const ok = await verifyOtp(phone, code);
    if (!ok) throw Errors.badRequest('Invalid or expired code.', 'OTP_INVALID');
    if (req.auth) {
      await prisma.user.update({
        where: { id: req.auth.userId },
        data: { phoneVerifiedAt: new Date() },
      });
    }
    res.json({ data: { verified: true } });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        createdAt: true,
        customerProfile: true,
        companionProfile: { include: { services: true } },
      },
    });
    res.json({ data: user });
  }),
);

authRouter.post(
  '/forgot-password',
  limits.auth,
  asyncHandler(async (req: Request, res: Response) => {
    // Always respond ok to prevent enumeration; email contains reset link.
    const { email } = req.body as { email?: string };
    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await notify(user.id, NotificationType.SAFETY_ALERT, { kind: 'PASSWORD_RESET_REQUESTED' });
      }
    }
    res.json({ data: { ok: true } });
  }),
);
