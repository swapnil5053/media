import { Router } from "express";
import type { SystemStatus } from "@shared/types.js";
import { metrics } from "../lib/metrics.js";
import { queueStats, recentJobs } from "../jobs/queue.js";
import { requireUser } from "../middleware/auth.js";

export const systemRouter = Router();

/** Prometheus scrape target. Left unauthenticated so it can be scraped in-cluster. */
systemRouter.get("/metrics", (_req, res) => {
  res.type("text/plain; version=0.0.4").send(metrics.render());
});

systemRouter.get("/status", requireUser, (req, res) => {
  const snapshot = metrics.snapshot();

  const status: SystemStatus = {
    queue: queueStats(),
    workers: snapshot.gauges.adaptflow_workers ?? 0,
    uptimeSeconds: snapshot.uptimeSeconds,
    counters: snapshot.counters,
    jobs: recentJobs(req.user!.id, 25).map((job) => ({
      id: job.id,
      type: job.type,
      mediaId: job.media_id,
      status: job.status,
      stage: job.stage,
      progress: job.progress,
      attempts: job.attempts,
      maxAttempts: job.max_attempts,
      error: job.error,
      durationMs: job.duration_ms,
      createdAt: job.created_at,
    })),
  };

  res.json(status);
});
