import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { limits } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { authRouter } from './routes/auth.routes.js';
import { companionsRouter } from './routes/companions.routes.js';
import { bookingsRouter } from './routes/bookings.routes.js';
import { paymentsRouter } from './routes/payments.routes.js';
import { walletRouter } from './routes/wallet.routes.js';
import { chatRouter } from './routes/chat.routes.js';
import { reviewsRouter } from './routes/reviews.routes.js';
import { socialRouter } from './routes/social.routes.js';
import { safetyRouter } from './routes/safety.routes.js';
import { notificationsRouter } from './routes/notifications.routes.js';
import { verificationRouter } from './routes/verification.routes.js';
import { adminRouter } from './routes/admin.routes.js';

export function createApp(): express.Express {
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: config.isProd ? undefined : false,
    }),
  );
  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow browsers from any local origin in dev; strict in production.
        const allowed = config.webOrigin;
        if (!origin || config.env !== 'production') return cb(null, true);
        return cb(null, origin === allowed);
      },
      credentials: true,
    }),
  );
  // Raw body needed for payment webhook signature verification — mounted in
  // the payments router BEFORE json(). Global json parser for everything else:
  app.use('/api/v1', (req, res, next) => {
    if (req.path === '/payments/webhook') return next();
    express.json({ limit: '1mb' })(req, res, next);
  });
  app.use(cookieParser());

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'saath-api' }));

  const api = express.Router();
  api.use(limits.global);

  // authRouter defines sub-paths (/login, /register …) → mount with prefix;
  // the remaining routers declare full resource paths and mount at the root.
  api.use('/auth', authRouter);
  api.use('/', companionsRouter);
  api.use('/', bookingsRouter);
  api.use('/', paymentsRouter);
  api.use('/', walletRouter);
  api.use('/', chatRouter);
  api.use('/', reviewsRouter);
  api.use('/', socialRouter);
  api.use('/', safetyRouter);
  api.use('/', notificationsRouter);
  api.use('/', verificationRouter);
  api.use('/', adminRouter);

  app.use('/api/v1', api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
