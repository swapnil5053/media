import type { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";
import { logger } from "../lib/logger.js";
import { metrics } from "../lib/metrics.js";

/** Every request gets an id that appears in its log line and in the response headers. */
export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.get("x-request-id") ?? nanoid(10);
  const startedAt = process.hrtime.bigint();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path;

    metrics.increment("adaptflow_http_requests_total", {
      method: req.method,
      status: String(res.statusCode),
    });
    metrics.observe("adaptflow_http_request_duration_seconds", durationMs, { method: req.method });

    if (res.statusCode >= 500 || durationMs > 2_000) {
      logger.warn("slow or failed request", {
        requestId,
        method: req.method,
        route,
        status: res.statusCode,
        durationMs: Math.round(durationMs),
      });
    }
  });

  next();
}
