import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";

/**
 * A small hand-rolled header set instead of a dependency. The connect-src and
 * media-src stay on 'self' because every byte the player fetches is ours.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "frame-ancestors *",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", CSP);

  if (config.isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}

/** Embed and watch pages are meant to be iframed, so they opt out of the frame ban. */
export function allowEmbedding(_req: Request, res: Response, next: NextFunction): void {
  res.removeHeader("X-Frame-Options");
  next();
}
