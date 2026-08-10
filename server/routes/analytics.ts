import { Router } from "express";
import { z } from "zod";
import { forbidden, notFound } from "../lib/errors.js";
import { param } from "../lib/params.js";
import { requireUser } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { recordEvent, summarise } from "../services/analytics-service.js";
import { findMedia } from "../services/media-service.js";
import { countActiveLinks } from "../services/share-service.js";
import { watchGrantFor } from "./stream-access.js";

const eventSchema = z.object({
  mediaId: z.string().min(1),
  type: z.enum(["start", "progress", "complete"]),
  percent: z.number().min(0).max(1),
  seconds: z.number().min(0).max(86_400),
});

export const analyticsRouter = Router();

/** Called by the player. Owners previewing their own video are counted too. */
analyticsRouter.post("/events", validateBody(eventSchema), (req, res) => {
  const body = req.body as z.infer<typeof eventSchema>;
  const media = findMedia(body.mediaId);
  if (!media) throw notFound("Unknown video.");

  const grant = watchGrantFor(req, body.mediaId);
  if (!grant && req.user?.id !== media.userId) throw forbidden();

  recordEvent({
    mediaId: body.mediaId,
    shareId: grant?.shareId ?? null,
    type: body.type,
    percent: body.percent,
    seconds: body.seconds,
    ip: req.ip ?? "unknown",
    userAgent: req.get("user-agent") ?? "unknown",
  });

  res.status(204).end();
});

analyticsRouter.get("/overview", requireUser, (req, res) => {
  res.json({
    ...summarise({ userId: req.user!.id }),
    activeLinks: countActiveLinks(req.user!.id),
  });
});

analyticsRouter.get("/media/:mediaId", requireUser, (req, res) => {
  const media = findMedia(param(req, "mediaId"));
  if (!media) throw notFound("That video no longer exists.");
  if (media.userId !== req.user!.id) throw forbidden();

  res.json(summarise({ mediaId: media.id }));
});
