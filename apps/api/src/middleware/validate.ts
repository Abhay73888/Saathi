import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

/** Validates req.body against a zod schema (shared schemas live in @saath/shared). */
export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
}
