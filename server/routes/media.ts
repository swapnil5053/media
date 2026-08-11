import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { z } from "zod";
import { PLANS } from "@shared/types.js";
import { config } from "../config.js";
import { enqueue } from "../jobs/queue.js";
import { cancelJobsForMedia, recentJobs } from "../jobs/queue.js";
import { badRequest, forbidden, notFound } from "../lib/errors.js";
import { param } from "../lib/params.js";
import { metrics } from "../lib/metrics.js";
import { mediaPaths } from "../media/storage.js";
import { requireUser } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { addCaption, deleteCaption } from "../services/caption-service.js";
import {
  assertWithinQuota,
  createMedia,
  deleteMedia,
  findMedia,
  listMedia,
  renameMedia,
} from "../services/media-service.js";

const ACCEPTED_EXTENSIONS = new Set([".mp4", ".mov", ".m4v", ".mkv", ".avi", ".webm", ".mts", ".3gp"]);

const incomingDir = path.join(config.dataDir, "incoming");
fs.mkdirSync(incomingDir, { recursive: true });

const upload = multer({
  dest: incomingDir,
  limits: { fileSize: PLANS.pro.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.has(extension)) {
      callback(badRequest(`We cannot read ${extension || "that file type"} yet. Try MP4, MOV, MKV, AVI or WebM.`));
      return;
    }
    callback(null, true);
  },
});

const captionUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1 } });

const uploadLimiter = rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false });

export const mediaRouter = Router();
mediaRouter.use(requireUser);

mediaRouter.get("/", (req, res) => {
  res.json(listMedia(req.user!.id));
});

mediaRouter.post("/", uploadLimiter, upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) throw badRequest("Choose a video file to upload.");

  try {
    assertWithinQuota(req.user!.id, req.user!.plan, file.size);
  } catch (error) {
    fs.rmSync(file.path, { force: true });
    throw error;
  }

  const extension = path.extname(file.originalname).toLowerCase();
  const title = path.basename(file.originalname, extension).replace(/[_-]+/g, " ").trim() || "Untitled video";

  const mediaId = createMedia({
    userId: req.user!.id,
    title,
    originalFilename: file.originalname,
    sizeBytes: file.size,
  });

  try {
    fs.mkdirSync(mediaPaths.dir(mediaId), { recursive: true });
    fs.renameSync(file.path, mediaPaths.source(mediaId, extension));
  } catch (error) {
    fs.rmSync(mediaPaths.dir(mediaId), { recursive: true, force: true });
    throw error;
  }

  // Paying accounts jump the queue; lower numbers are claimed first.
  enqueue({
    type: "process-media",
    payload: { mediaId, userId: req.user!.id },
    mediaId,
    userId: req.user!.id,
    priority: req.user!.plan === "pro" ? 10 : 100,
  });

  metrics.increment("adaptflow_uploads_total", { plan: req.user!.plan });
  res.status(202).json(findMedia(mediaId));
});

function ownedMedia(req: import("express").Request) {
  const media = findMedia(param(req, "id"));
  if (!media) throw notFound("That video no longer exists.");
  if (media.userId !== req.user!.id) throw forbidden();
  return media;
}

mediaRouter.get("/:id", (req, res) => {
  res.json(ownedMedia(req));
});

mediaRouter.get("/:id/jobs", (req, res) => {
  const media = ownedMedia(req);
  res.json(
    recentJobs(req.user!.id, 50)
      .filter((job) => job.media_id === media.id)
      .map((job) => ({
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
  );
});

mediaRouter.patch("/:id", validateBody(z.object({ title: z.string().min(1).max(120) })), (req, res) => {
  const media = ownedMedia(req);
  renameMedia(media.id, (req.body as { title: string }).title.trim());
  res.json(findMedia(media.id));
});

mediaRouter.delete("/:id", (req, res) => {
  const media = ownedMedia(req);
  cancelJobsForMedia(media.id);
  deleteMedia(media.id);
  res.status(204).end();
});

mediaRouter.post("/:id/cancel", (req, res) => {
  const media = ownedMedia(req);
  if (media.status === "ready") throw badRequest("This video has already finished processing.");

  cancelJobsForMedia(media.id);
  deleteMedia(media.id);
  res.status(204).end();
});

mediaRouter.post("/:id/captions", captionUpload.single("file"), (req, res) => {
  const media = ownedMedia(req);
  if (!req.file) throw badRequest("Choose a .srt or .vtt file.");

  const label = typeof req.body?.label === "string" && req.body.label.trim() ? req.body.label.trim() : "English";
  const language = typeof req.body?.language === "string" && req.body.language.trim() ? req.body.language.trim() : "en";

  res.status(201).json(addCaption({ mediaId: media.id, label, language, content: req.file.buffer.toString("utf8") }));
});

mediaRouter.delete("/:id/captions/:captionId", (req, res) => {
  const media = ownedMedia(req);
  deleteCaption(media.id, param(req, "captionId"));
  res.status(204).end();
});

function sendOwnedFile(req: import("express").Request, res: import("express").Response, filePath: string, type: string) {
  ownedMedia(req);
  if (!fs.existsSync(filePath)) throw notFound("That file has not been generated.");
  res.type(type).setHeader("Cache-Control", "private, max-age=3600");
  res.sendFile(filePath);
}

mediaRouter.get("/:id/poster", (req, res) => {
  sendOwnedFile(req, res, mediaPaths.poster(param(req, "id")), "image/jpeg");
});

mediaRouter.get("/:id/sprite", (req, res) => {
  sendOwnedFile(req, res, mediaPaths.sprite(param(req, "id")), "image/jpeg");
});
