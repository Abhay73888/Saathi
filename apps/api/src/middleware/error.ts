import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, Errors } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please check the submitted details.',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    if (err.status >= 500) logger.error(err.code, { path: req.path, message: err.message });
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // Unknown error — log full detail server-side, never leak it.
  logger.error('UNHANDLED_ERROR', {
    path: req.path,
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  const internal = Errors.internal();
  res.status(internal.status).json({
    error: { code: internal.code, message: internal.message },
  });
}
