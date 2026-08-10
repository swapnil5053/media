import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

/** Replaces the raw body with the parsed result, so handlers only see valid data. */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
}
