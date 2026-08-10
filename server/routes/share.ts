import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import type { WatchPayload } from "@shared/types.js";
import { codecLabel } from "../media/compatibility.js";
import { forbidden, notFound } from "../lib/errors.js";
import { param } from "../lib/params.js";
import { requireUser } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { findMedia } from "../services/media-service.js";
import { createShareLink, listShareLinks, openShareLink, revokeShareLink } from "../services/share-service.js";
import { grantWatchAccess } from "./stream-access.js";

const createSchema = z.object({
  mediaId: z.string().min(1),
  password: z.string().min(4, "Use at least 4 characters.").max(72).optional(),
  expiresInHours: z.number().int().positive().max(24 * 365).optional(),
  maxViews: z.number().int().positive().max(100_000).optional(),
});

const openSchema = z.object({ password: z.string().max(72).optional() });

const openLimiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false });

export const shareRouter = Router();

shareRouter.post("/", requireUser, validateBody(createSchema), async (req, res) => {
  const body = req.body as z.infer<typeof createSchema>;
  const media = findMedia(body.mediaId);
  if (!media) throw notFound("That video no longer exists.");
  if (media.userId !== req.user!.id) throw forbidden();

  res.status(201).json(await createShareLink({ ...body, userId: req.user!.id }));
});

shareRouter.get("/media/:mediaId", requireUser, (req, res) => {
  const media = findMedia(param(req, "mediaId"));
  if (!media) throw notFound("That video no longer exists.");
  if (media.userId !== req.user!.id) throw forbidden();

  res.json(listShareLinks(media.id));
});

shareRouter.delete("/:slug", requireUser, (req, res) => {
  revokeShareLink(param(req, "slug"), req.user!.id);
  res.status(204).end();
});

/** The public endpoint behind /w/:slug. */
shareRouter.post("/:slug/open", openLimiter, validateBody(openSchema), async (req, res) => {
  const { password } = req.body as z.infer<typeof openSchema>;
  const { shareId, mediaId } = await openShareLink(param(req, "slug"), password);

  const media = findMedia(mediaId);
  if (!media || media.status !== "ready") throw notFound("This video is still being processed.");

  grantWatchAccess(req, res, { mediaId, shareId });

  const payload: WatchPayload = {
    mediaId,
    title: media.title,
    posterUrl: media.posterUrl ? `/api/stream/${mediaId}/poster.jpg` : null,
    mp4Url: `/api/stream/${mediaId}/video.mp4`,
    hlsUrl: media.hasHls ? `/api/stream/${mediaId}/hls/master.m3u8` : null,
    durationSeconds: media.source?.durationSeconds ?? 0,
    convertedFrom: media.wasConverted && media.source ? codecLabel(media.source.videoCodec) : null,
  };

  res.json(payload);
});
