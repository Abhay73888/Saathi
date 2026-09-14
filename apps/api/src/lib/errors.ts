/** Stable, client-safe error codes. Raw internals are never leaked. */

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const Errors = {
  unauthorized: (msg = 'Authentication required') => new AppError('UNAUTHORIZED', 401, msg),
  forbidden: (msg = 'You do not have permission to do that') =>
    new AppError('FORBIDDEN', 403, msg),
  notFound: (what = 'Resource') => new AppError('NOT_FOUND', 404, `${what} not found`),
  badRequest: (msg: string, code = 'BAD_REQUEST', details?: unknown) =>
    new AppError(code, 400, msg, details),
  conflict: (msg: string, code = 'CONFLICT') => new AppError(code, 409, msg),
  tooMany: (msg = 'Too many requests — please slow down') =>
    new AppError('RATE_LIMITED', 429, msg),
  slotUnavailable: () =>
    new AppError('BOOKING_SLOT_UNAVAILABLE', 409, 'That time slot was just taken.'),
  paymentFailed: (msg = 'Payment failed') => new AppError('PAYMENT_FAILED', 402, msg),
  internal: () => new AppError('INTERNAL_ERROR', 500, 'Something went wrong. Please try again.'),
};
