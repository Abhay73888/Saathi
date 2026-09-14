import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@saath/shared';
import { verifyAccessToken } from '../services/token.service.js';
import { Errors } from '../lib/errors.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; role: UserRole; email: string };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    next(Errors.unauthorized());
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    next(Errors.unauthorized('Your session has expired. Please sign in again.'));
  }
}

/** Role-based access control. Usage: requireRole('ADMIN') */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(Errors.unauthorized());
    if (!roles.includes(req.auth.role)) return next(Errors.forbidden());
    next();
  };
}
