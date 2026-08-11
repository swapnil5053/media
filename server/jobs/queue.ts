import { nanoid } from "nanoid";
import { db } from "../db/index.js";
import { metrics } from "../lib/metrics.js";

export type JobType = "process-media" | "deliver-webhook";
export type JobStatus = "queued" | "running" | "done" | "failed" | "cancelled";

export interface JobRow {
  id: string;
  type: JobType;
  payload: string;
  media_id: string | null;
  user_id: string | null;
  priority: number;
  status: JobStatus;
  stage: string;
  progress: number;
  attempts: number;
  max_attempts: number;
  run_at: string;
  error: string | null;
  worker: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
}

const RETRY_BASE_MS = 2_000;
const RETRY_CEILING_MS = 5 * 60_000;

/** Exponential backoff with jitter, so a burst of failures does not retry in lockstep. */
export function backoffDelay(attempts: number): number {
  const exponential = Math.min(RETRY_BASE_MS * 2 ** Math.max(0, attempts - 1), RETRY_CEILING_MS);
  return Math.round(exponential * (0.75 + Math.random() * 0.5));
}

export function enqueue(input: {
  type: JobType;
  payload: unknown;
  mediaId?: string;
  userId?: string;
  priority?: number;
  maxAttempts?: number;
  delayMs?: number;
}): string {
  const id = nanoid(12);
  const runAt = new Date(Date.now() + (input.delayMs ?? 0)).toISOString();

  db.prepare(
    `INSERT INTO job_queue (id, type, payload, media_id, user_id, priority, max_attempts, run_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.type,
    JSON.stringify(input.payload),
    input.mediaId ?? null,
    input.userId ?? null,
    input.priority ?? 100,
    input.maxAttempts ?? 3,
    runAt,
    new Date().toISOString(),
  );

  metrics.increment("adaptflow_jobs_enqueued_total", { type: input.type });
  return id;
}

/**
 * Claims the highest-priority runnable job. The select and update run in one
 * transaction so two workers can never take the same row.
 */
export const claimNext = db.transaction((worker: string): JobRow | null => {
  const candidate = db
    .prepare(
      `SELECT id FROM job_queue
       WHERE status = 'queued' AND run_at <= ?
       ORDER BY priority ASC, run_at ASC
       LIMIT 1`,
    )
    .get(new Date().toISOString()) as { id: string } | undefined;

  if (!candidate) return null;

  const claimed = db
    .prepare(
      `UPDATE job_queue SET status = 'running', worker = ?, started_at = ?, attempts = attempts + 1
       WHERE id = ? AND status = 'queued'`,
    )
    .run(worker, new Date().toISOString(), candidate.id);

  if (claimed.changes === 0) return null;

  return db.prepare(`SELECT * FROM job_queue WHERE id = ?`).get(candidate.id) as JobRow;
});

export function reportProgress(jobId: string, stage: string, progress: number): void {
  db.prepare(`UPDATE job_queue SET stage = ?, progress = ? WHERE id = ? AND status = 'running'`).run(
    stage,
    progress,
    jobId,
  );
}

export function completeJob(job: JobRow): void {
  const durationMs = job.started_at ? Date.now() - new Date(job.started_at).getTime() : 0;

  db.prepare(
    `UPDATE job_queue SET status = 'done', stage = 'done', progress = 1, finished_at = ?, duration_ms = ?, error = NULL
     WHERE id = ?`,
  ).run(new Date().toISOString(), durationMs, job.id);

  metrics.increment("adaptflow_jobs_completed_total", { type: job.type });
  metrics.observe("adaptflow_job_duration_seconds", durationMs, { type: job.type });
}

/** Returns true when the job was rescheduled rather than given up on. */
export function failJob(job: JobRow, message: string): boolean {
  const willRetry = job.attempts < job.max_attempts;

  if (willRetry) {
    db.prepare(
      `UPDATE job_queue SET status = 'queued', stage = 'retrying', error = ?, run_at = ?, worker = NULL WHERE id = ?`,
    ).run(message, new Date(Date.now() + backoffDelay(job.attempts)).toISOString(), job.id);

    metrics.increment("adaptflow_jobs_retried_total", { type: job.type });
    return true;
  }

  db.prepare(`UPDATE job_queue SET status = 'failed', error = ?, finished_at = ? WHERE id = ?`).run(
    message,
    new Date().toISOString(),
    job.id,
  );

  metrics.increment("adaptflow_jobs_failed_total", { type: job.type });
  return false;
}

export function cancelJobsForMedia(mediaId: string): void {
  db.prepare(
    `UPDATE job_queue SET status = 'cancelled', finished_at = ? WHERE media_id = ? AND status IN ('queued', 'running')`,
  ).run(new Date().toISOString(), mediaId);
}

export function isCancelled(jobId: string): boolean {
  const row = db.prepare(`SELECT status FROM job_queue WHERE id = ?`).get(jobId) as { status: JobStatus } | undefined;
  return row?.status === "cancelled";
}

/** Anything still marked running at boot belonged to a process that no longer exists. */
export function requeueOrphans(): number {
  return db
    .prepare(
      `UPDATE job_queue SET status = 'queued', stage = 'requeued', worker = NULL, run_at = ?
       WHERE status = 'running'`,
    )
    .run(new Date().toISOString()).changes;
}

export function latestJobForMedia(mediaId: string): JobRow | null {
  return (
    (db
      .prepare(`SELECT * FROM job_queue WHERE media_id = ? ORDER BY created_at DESC LIMIT 1`)
      .get(mediaId) as JobRow | undefined) ?? null
  );
}

export interface QueueStats {
  queued: number;
  running: number;
  failed: number;
  completedToday: number;
  averageDurationMs: number;
  oldestQueuedSeconds: number;
}

export function queueStats(): QueueStats {
  const counts = db
    .prepare(`SELECT status, COUNT(*) AS total FROM job_queue GROUP BY status`)
    .all() as Array<{ status: JobStatus; total: number }>;

  const byStatus = (status: JobStatus) => counts.find((row) => row.status === status)?.total ?? 0;

  const today = new Date().toISOString().slice(0, 10);
  const completed = db
    .prepare(
      `SELECT COUNT(*) AS total, COALESCE(AVG(duration_ms), 0) AS average
       FROM job_queue WHERE status = 'done' AND substr(finished_at, 1, 10) = ?`,
    )
    .get(today) as { total: number; average: number };

  const oldest = db
    .prepare(`SELECT run_at FROM job_queue WHERE status = 'queued' ORDER BY run_at ASC LIMIT 1`)
    .get() as { run_at: string } | undefined;

  return {
    queued: byStatus("queued"),
    running: byStatus("running"),
    failed: byStatus("failed"),
    completedToday: completed.total,
    averageDurationMs: Math.round(completed.average),
    oldestQueuedSeconds: oldest ? Math.max(0, Math.round((Date.now() - new Date(oldest.run_at).getTime()) / 1000)) : 0,
  };
}

export function recentJobs(userId: string, limit = 20): JobRow[] {
  return db
    .prepare(`SELECT * FROM job_queue WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(userId, limit) as JobRow[];
}
