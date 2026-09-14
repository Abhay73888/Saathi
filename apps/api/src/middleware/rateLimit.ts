import type { NextFunction, Request, Response } from 'express';
import { redis } from '../lib/redis.js';
import { Errors } from '../lib/errors.js';

/**
 * Redis fixed-window rate limiter. Fails OPEN if Redis is unavailable
 * (availability over strictness for non-auth windows).
 */
export function rateLimit(opts: {
  keyPrefix: string;
  windowSeconds: number;
  max: number;
  failOpen?: boolean;
}) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const key = `rl:${opts.keyPrefix}:${ip}`;
    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, opts.windowSeconds);
      if (count > opts.max) {
        next(Errors.tooMany());
        return;
      }
    } catch (err) {
      if (!opts.failOpen) {
        next(err);
        return;
      }
    }
    next();
  };
}

export const limits = {
  global: rateLimit({ keyPrefix: 'global', windowSeconds: 60, max: 120, failOpen: true }),
  auth: rateLimit({ keyPrefix: 'auth', windowSeconds: 60, max: 8, failOpen: false }),
  otp: rateLimit({ keyPrefix: 'otp', windowSeconds: 3600, max: 5, failOpen: false }),
  booking: rateLimit({ keyPrefix: 'booking', windowSeconds: 3600, max: 30, failOpen: true }),
  chat: rateLimit({ keyPrefix: 'chat', windowSeconds: 10, max: 20, failOpen: true }),
};
