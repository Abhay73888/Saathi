import { Redis } from 'ioredis';
import { config } from '../config.js';

const isProduction = config.env === 'production';
const hasCustomRedis = !!process.env.REDIS_URL;

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy(times) {
    if (!hasCustomRedis && isProduction) {
      // Don't spam retries if no cloud Redis is provided in production
      return null;
    }
    return Math.min(times * 1000, 10000);
  },
});

redis.connect().catch((err) => {
  if (hasCustomRedis || !isProduction) {
    console.warn('[redis] initial connect note:', err.message);
  }
});

redis.on('error', (err) => {
  if (hasCustomRedis) {
    console.error('[redis] error:', err.message);
  }
});

