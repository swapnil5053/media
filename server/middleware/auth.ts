import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../lib/errors.js";
import { findUserByToken } from "../services/api-key-service.js";
import { SESSION_COOKIE, findUserBySession, type UserRow } from "../services/auth-service.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: UserRow;
    /** Set when the caller authenticated with an API key rather than a session. */
    viaApiKey?: boolean;
    requestId?: string;
  }
}

/** Sessions for the app, bearer tokens for the public API. Both land on req.user. */
export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  const header = req.get("authorization");

  if (header?.startsWith("Bearer ")) {
    const user = findUserByToken(header.slice(7).trim());
    if (user) {
      req.user = user;
      req.viaApiKey = true;
      next();
      return;
    }
  }

  const sessionId = req.signedCookies?.[SESSION_COOKIE] as string | undefined;
  if (sessionId) req.user = findUserBySession(sessionId) ?? undefined;

  next();
}

export function requireUser(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(unauthorized());
    return;
  }
  next();
}

/** API keys are for uploading and reading, never for changing account settings. */
export function requireSession(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(unauthorized());
    return;
  }
  if (req.viaApiKey) {
    next(unauthorized("This endpoint needs a signed-in session, not an API key."));
    return;
  }
  next();
}
