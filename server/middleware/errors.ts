import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not found", code: "not_found" });
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message, code: error.code });
    return;
  }

  if (error instanceof ZodError) {
    const first = error.issues[0];
    res.status(400).json({ error: first?.message ?? "That request was not valid.", code: "invalid_input" });
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  logger.error("unhandled request error", { path: req.path, method: req.method, error: message });
  res.status(500).json({ error: "Something went wrong on our end.", code: "internal" });
}
