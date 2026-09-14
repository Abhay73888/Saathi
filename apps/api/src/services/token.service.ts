import jwt from 'jsonwebtoken';
import { randomUUID, createHash } from 'node:crypto';
import type { UserRole } from '@saath/shared';
import { config } from '../config.js';
import { redis } from '../lib/redis.js';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: `${config.jwt.accessTtlMinutes}m`,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
}

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

/**
 * Refresh tokens: opaque random UUIDs handed to the client in an httpOnly
 * cookie; only their SHA-256 hash is stored (Redis + DB sessions).
 */
export function issueRefreshToken(userId: string): { token: string; familyId: string; expiresAt: Date } {
  const token = randomUUID() + randomUUID();
  const familyId = randomUUID();
  const expiresAt = new Date(Date.now() + config.jwt.refreshTtlDays * 86_400_000);
  void redis.set(`refresh:${sha256(token)}`, JSON.stringify({ userId, familyId }), 'EX', config.jwt.refreshTtlDays * 86_400);
  return { token, familyId, expiresAt };
}

export async function consumeRefreshToken(token: string): Promise<{ userId: string; familyId: string } | null> {
  const key = `refresh:${sha256(token)}`;
  const raw = await redis.get(key);
  if (!raw) return null;
  // Rotate: single use.
  await redis.del(key);
  return JSON.parse(raw) as { userId: string; familyId: string };
}

export async function revokeAllForUser(userId: string): Promise<void> {
  const stream = redis.scanStream({ match: `refresh:*`, count: 200 });
  const deletes: Promise<number>[] = [];
  for await (const keys of stream) {
    for (const k of keys as string[]) {
      const raw = await redis.get(k);
      if (raw && JSON.parse(raw).userId === userId) deletes.push(redis.del(k));
    }
  }
  await Promise.all(deletes);
}

export const refreshCookieName = 'saath_rt';
export function hashToken(token: string): string {
  return sha256(token);
}
