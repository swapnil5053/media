import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../lib/errors.js";
import { SESSION_COOKIE, findUserBySession, type UserRow } from "../services/auth-service.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: UserRow;
  }
}

export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  const sessionId = req.signedCookies?.[SESSION_COOKIE] as string | undefined;
  if (sessionId) {
    req.user = findUserBySession(sessionId) ?? undefined;
  }
  next();
}

export function requireUser(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(unauthorized());
    return;
  }
  next();
}
