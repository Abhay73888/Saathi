import { randomInt } from 'node:crypto';
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';

/**
 * Phone OTP. 6-digit code, 5-minute TTL, max 5 attempts.
 * In dev/mock mode the code is logged instead of sending an SMS.
 */
const TTL_SECONDS = 300;
const MAX_ATTEMPTS = 5;

function key(phone: string): string {
  return `otp:${phone}`;
}

export async function issueOtp(phone: string): Promise<{ devCode?: string }> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await redis.set(key(phone), JSON.stringify({ code, attempts: 0 }), 'EX', TTL_SECONDS);
  // SMS provider integration (MSG91 etc.) plugs in here.
  logger.info('otp.issued', { phone, devCode: code });
  return process.env.NODE_ENV === 'production' ? {} : { devCode: code };
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const raw = await redis.get(key(phone));
  if (!raw) return false;
  const data = JSON.parse(raw) as { code: string; attempts: number };
  if (data.attempts >= MAX_ATTEMPTS) {
    await redis.del(key(phone));
    return false;
  }
  if (data.code !== code) {
    await redis.set(
      key(phone),
      JSON.stringify({ ...data, attempts: data.attempts + 1 }),
      'EX',
      TTL_SECONDS,
    );
    return false;
  }
  await redis.del(key(phone));
  return true;
}
