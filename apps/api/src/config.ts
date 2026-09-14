import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  databaseUrl: required(
    'DATABASE_URL',
    'postgresql://saath:saath@127.0.0.1:5432/saath?schema=public',
  ),
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret-change-me-min-32-chars'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me-min-32-chars'),
    accessTtlMinutes: Number(process.env.ACCESS_TTL_MINUTES ?? 15),
    refreshTtlDays: Number(process.env.REFRESH_TTL_DAYS ?? 30),
  },
  payments: {
    mock: process.env.PAYMENTS_MOCK !== 'false',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  },
  idv: {
    mock: process.env.IDV_MOCK !== 'false',
    provider: process.env.IDV_PROVIDER ?? 'mock',
  },
  isProd: process.env.NODE_ENV === 'production',
};
