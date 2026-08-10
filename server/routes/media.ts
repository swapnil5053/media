import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { z } from "zod";
import { PLANS } from "@shared/types.js";
import { config } from "../config.js";
import { badRequest, forbidden, notFound } from "../lib/errors.js";
import { param } from "../lib/params.js";
import { discardUpload, enqueue } from "../media/pipeline.js";
import { mediaPaths } from "../media/storage.js";
import { requireUser } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import {
  assertWithinQuota,
  createMedia,
  deleteMedia,
  findMedia,
  listMedia,
  renameMedia,
} from "../services/media-service.js";

const ACCEPTED_EXTENSIONS = new Set([".mp4", ".mov", ".m4v", ".mkv", ".avi", ".webm", ".mts", ".3gp"]);

const uploadDir = path.join(config.dataDir, "incoming");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
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
    discardUpload(mediaId);
    throw error;
  }

  enqueue({ mediaId, userId: req.user!.id });
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

mediaRouter.patch("/:id", validateBody(z.object({ title: z.string().min(1).max(120) })), (req, res) => {
  const media = ownedMedia(req);
  renameMedia(media.id, (req.body as { title: string }).title.trim());
  res.json(findMedia(media.id));
});

mediaRouter.delete("/:id", (req, res) => {
  deleteMedia(ownedMedia(req).id);
  res.status(204).end();
});

mediaRouter.get("/:id/poster", (req, res) => {
  const media = ownedMedia(req);
  const poster = mediaPaths.poster(media.id);
  if (!fs.existsSync(poster)) throw notFound("No poster has been generated for this video.");

  res.type("image/jpeg").sendFile(poster);
});
