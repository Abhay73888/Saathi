import { createServer } from 'node:http';
import { createApp } from './app.js';
import { config } from './config.js';
import { connectDb } from './lib/prisma.js';
import { logger } from './lib/logger.js';
import { initSocket } from './realtime/socket.js';
import { startScheduler } from './jobs/scheduler.js';

async function main(): Promise<void> {
  await connectDb();
  const app = createApp();
  const httpServer = createServer(app);
  initSocket(httpServer);
  startScheduler();

  httpServer.listen(config.port, '0.0.0.0', () => {
    logger.info('server.listening', { port: config.port, env: config.env, paymentsMock: config.payments.mock });
  });
}

main().catch((err) => {
  logger.error('server.boot_failed', { message: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
