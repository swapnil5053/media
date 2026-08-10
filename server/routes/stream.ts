import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { forbidden, notFound } from "../lib/errors.js";
import { mediaPaths, resolveInsideMediaDir } from "../media/storage.js";
import { findMedia } from "../services/media-service.js";
import { watchGrantFor } from "./stream-access.js";

const CONTENT_TYPES: Record<string, string> = {
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
  ".mp4": "video/mp4",
  ".jpg": "image/jpeg",
};

export const streamRouter = Router();

/** Either you own the video, or you arrived through a share link that is still valid. */
function assertCanWatch(req: import("express").Request, mediaId: string) {
  const media = findMedia(mediaId);
  if (!media || media.status !== "ready") throw notFound("This video is not ready to play.");

  const isOwner = req.user?.id === media.userId;
  if (!isOwner && !watchGrantFor(req, mediaId)) throw forbidden("Open this video through its share link.");

  return media;
}

function send(res: import("express").Response, filePath: string) {
  if (!fs.existsSync(filePath)) throw notFound("That file is not available.");

  const type = CONTENT_TYPES[path.extname(filePath).toLowerCase()];
  if (type) res.type(type);
  res.setHeader("Cache-Control", "private, max-age=3600");
  res.sendFile(filePath);
}

streamRouter.get("/:mediaId/video.mp4", (req, res) => {
  assertCanWatch(req, req.params.mediaId!);
  send(res, mediaPaths.delivery(req.params.mediaId!));
});

streamRouter.get("/:mediaId/poster.jpg", (req, res) => {
  assertCanWatch(req, req.params.mediaId!);
  send(res, mediaPaths.poster(req.params.mediaId!));
});

streamRouter.get("/:mediaId/hls/*splat", (req, res) => {
  const mediaId = req.params.mediaId!;
  assertCanWatch(req, mediaId);

  const requested = Array.isArray(req.params.splat) ? req.params.splat.join("/") : String(req.params.splat ?? "");
  const resolved = resolveInsideMediaDir(mediaId, path.join("hls", requested));
  if (!resolved) throw forbidden("That path is not allowed.");

  send(res, resolved);
});
