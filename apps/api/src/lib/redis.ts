import { Redis } from 'ioredis';
import { config } from '../config.js';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redis.on('error', (err) => {
  // Rate limiting / OTP must fail-open with a log in dev, alert in prod.
  console.error('[redis] error:', err.message);
});
