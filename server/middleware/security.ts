import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";

/**
 * A small hand-rolled header set instead of a dependency. connect-src and
 * media-src stay on 'self' because every byte the player fetches is ours.
 *
 * Vite's dev server needs two holes that production must not have: it injects
 * the React Fast Refresh preamble as an inline script, and it talks to the
 * browser over a websocket for hot reloading.
 */
function contentSecurityPolicy(): string {
  const scriptSrc = config.isProduction ? "script-src 'self'" : "script-src 'self' 'unsafe-inline'";
  const connectSrc = config.isProduction ? "connect-src 'self'" : "connect-src 'self' ws: wss:";

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://api.fontshare.com",
    "font-src 'self' https://cdn.fontshare.com",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    connectSrc,
    "frame-ancestors *",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

const CSP = contentSecurityPolicy();

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
