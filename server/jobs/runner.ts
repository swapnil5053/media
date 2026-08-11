import { nanoid } from "nanoid";
import { logger } from "../lib/logger.js";
import { metrics } from "../lib/metrics.js";
import {
  claimNext,
  completeJob,
  failJob,
  isCancelled,
  queueStats,
  reportProgress,
  requeueOrphans,
  type JobRow,
  type JobType,
} from "./queue.js";

export interface JobContext<T = unknown> {
  job: JobRow;
  payload: T;
  signal: AbortSignal;
  progress: (stage: string, fraction: number) => void;
}

type Handler = (context: JobContext<never>) => Promise<void>;

const IDLE_POLL_MS = 300;
const CANCEL_POLL_MS = 1_000;

const handlers = new Map<JobType, Handler>();
const active = new Map<string, AbortController>();

let draining = false;
let running = 0;

export function registerHandler<T>(type: JobType, handler: (context: JobContext<T>) => Promise<void>): void {
  handlers.set(type, handler as Handler);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runJob(job: JobRow): Promise<void> {
  const handler = handlers.get(job.type);
  if (!handler) {
    failJob(job, `No handler registered for ${job.type}`);
    return;
  }

  const controller = new AbortController();
  active.set(job.id, controller);

  // A job can be cancelled from a request handler, so the flag is polled and
  // turned into an abort the ffmpeg child process can actually respond to.
  const cancelWatch = setInterval(() => {
    if (isCancelled(job.id)) controller.abort();
  }, CANCEL_POLL_MS);

  try {
    await handler({
      job,
      payload: JSON.parse(job.payload) as never,
      signal: controller.signal,
      progress: (stage, fraction) => reportProgress(job.id, stage, Math.min(1, Math.max(0, fraction))),
    });

    if (controller.signal.aborted) {
      logger.info("job cancelled", { jobId: job.id, type: job.type });
      return;
    }

    completeJob(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (controller.signal.aborted) {
      logger.info("job cancelled mid-flight", { jobId: job.id, type: job.type });
      return;
    }

    const retrying = failJob(job, message);
    logger.warn("job failed", { jobId: job.id, type: job.type, attempt: job.attempts, retrying, error: message });
  } finally {
    clearInterval(cancelWatch);
    active.delete(job.id);
  }
}

async function workerLoop(name: string): Promise<void> {
  while (!draining) {
    const job = claimNext(name);

    if (!job) {
      await sleep(IDLE_POLL_MS);
      continue;
    }

    running += 1;
    try {
      await runJob(job);
    } finally {
      running -= 1;
    }
  }
}

export function startWorkers(count: number): void {
  const requeued = requeueOrphans();
  if (requeued > 0) logger.warn("requeued orphaned jobs", { count: requeued });

  metrics.gauge("adaptflow_queue_depth", () => queueStats().queued);
  metrics.gauge("adaptflow_jobs_running", () => running);
  metrics.gauge("adaptflow_workers", () => count);

  for (let index = 0; index < count; index += 1) {
    void workerLoop(`worker-${index + 1}-${nanoid(4)}`);
  }

  logger.info("workers started", { count });
}

/** Stops claiming, lets in-flight work finish, then aborts whatever is left. */
export async function stopWorkers(timeoutMs = 15_000): Promise<void> {
  draining = true;
  const deadline = Date.now() + timeoutMs;

  while (running > 0 && Date.now() < deadline) {
    await sleep(200);
  }

  for (const controller of active.values()) controller.abort();

  const requeued = requeueOrphans();
  logger.info("workers stopped", { requeued });
}
