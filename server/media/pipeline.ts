import fs from "node:fs";
import { nanoid } from "nanoid";
import type { MediaStatus } from "@shared/types.js";
import { db } from "../db/index.js";
import { mediaEvents } from "../events/bus.js";
import { logger } from "../lib/logger.js";
import { findMedia, markReady, saveProbeResult, setStatus } from "../services/media-service.js";
import { isUniversallyPlayable } from "./compatibility.js";
import { extractPoster, packageHls, remuxToMp4, transcodeToUniversalMp4 } from "./ffmpeg.js";
import { probe } from "./probe.js";
import { findSourceFile, mediaPaths } from "./storage.js";

interface QueueItem {
  mediaId: string;
  userId: string;
}

/** Stage boundaries so the progress bar moves once, from 0 to 1, across the whole job. */
const STAGES = {
  probing: { from: 0, to: 0.05 },
  converting: { from: 0.05, to: 0.65 },
  poster: { from: 0.65, to: 0.7 },
  packaging: { from: 0.7, to: 1 },
} as const;

type Stage = keyof typeof STAGES;

const queue: QueueItem[] = [];
let running = false;

export function enqueue(item: QueueItem): void {
  db.prepare(`INSERT INTO jobs (id, media_id, stage, status, progress, created_at) VALUES (?, ?, 'queued', 'queued', 0, ?)`)
    .run(nanoid(12), item.mediaId, new Date().toISOString());

  queue.push(item);
  void drain();
}

async function drain(): Promise<void> {
  if (running) return;
  running = true;

  while (queue.length > 0) {
    const item = queue.shift()!;
    try {
      await process(item);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Processing failed";
      logger.error("pipeline failed", { mediaId: item.mediaId, error: message });
      setStatus(item.mediaId, "failed", message);
      finishJob(item.mediaId, "failed", message);
      publish(item, "failed", 0, message);
    }
  }

  running = false;
}

function updateJob(mediaId: string, stage: Stage, progress: number): void {
  db.prepare(
    `UPDATE jobs SET stage = ?, status = 'running', progress = ?
     WHERE id = (SELECT id FROM jobs WHERE media_id = ? ORDER BY created_at DESC LIMIT 1)`,
  ).run(stage, progress, mediaId);
}

function finishJob(mediaId: string, status: "done" | "failed", error?: string): void {
  db.prepare(
    `UPDATE jobs SET status = ?, error = ?, finished_at = ?, progress = ?
     WHERE id = (SELECT id FROM jobs WHERE media_id = ? ORDER BY created_at DESC LIMIT 1)`,
  ).run(status, error ?? null, new Date().toISOString(), status === "done" ? 1 : 0, mediaId);
}

function publish(item: QueueItem, status: MediaStatus, progress: number, message: string): void {
  const media = findMedia(item.mediaId);
  mediaEvents.publish({
    userId: item.userId,
    mediaId: item.mediaId,
    status,
    progress,
    title: media?.title ?? "Video",
    message,
  });
}

async function process(item: QueueItem): Promise<void> {
  const sourcePath = findSourceFile(item.mediaId);
  if (!sourcePath) throw new Error("The uploaded file is missing from storage");

  const report = (stage: Stage, fraction: number) => {
    const { from, to } = STAGES[stage];
    updateJob(item.mediaId, stage, from + (to - from) * fraction);
  };

  setStatus(item.mediaId, "probing");
  publish(item, "probing", STAGES.probing.from, "Reading video details");
  const source = await probe(sourcePath);
  saveProbeResult(item.mediaId, source);
  report("probing", 1);

  const needsConversion = !isUniversallyPlayable(source);

  setStatus(item.mediaId, "transcoding");
  publish(
    item,
    "transcoding",
    STAGES.converting.from,
    needsConversion ? "Converting to a format every device can play" : "Preparing for streaming",
  );

  if (needsConversion) {
    await transcodeToUniversalMp4(sourcePath, item.mediaId, source, (fraction) => report("converting", fraction));
  } else {
    await remuxToMp4(sourcePath, item.mediaId, source);
    report("converting", 1);
  }

  const deliveryPath = mediaPaths.delivery(item.mediaId);
  const hasPoster = await extractPoster(deliveryPath, item.mediaId, source.durationSeconds);
  report("poster", 1);

  const hasHls = await packageHls(deliveryPath, item.mediaId, source, (fraction) => report("packaging", fraction));
  if (!hasHls) {
    logger.warn("hls packaging skipped", { mediaId: item.mediaId });
    report("packaging", 1);
  }

  markReady(item.mediaId, { wasConverted: needsConversion, hasHls, hasPoster });
  finishJob(item.mediaId, "done");
  publish(item, "ready", 1, needsConversion ? "Converted and ready to share" : "Ready to share");

  logger.info("media ready", {
    mediaId: item.mediaId,
    converted: needsConversion,
    hls: hasHls,
    sourceCodec: source.videoCodec,
  });
}

/** Frees disk when an upload is rejected before the pipeline ever starts. */
export function discardUpload(mediaId: string): void {
  fs.rmSync(mediaPaths.dir(mediaId), { recursive: true, force: true });
}
