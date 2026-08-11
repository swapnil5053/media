import type { MediaStatus } from "@shared/types.js";
import { mediaEvents } from "../../events/bus.js";
import { logger } from "../../lib/logger.js";
import { isUniversallyPlayable } from "../../media/compatibility.js";
import {
  extractPoster,
  generateStoryboard,
  packageHls,
  remuxToMp4,
  transcodeToUniversalMp4,
} from "../../media/ffmpeg.js";
import { fingerprintVideo } from "../../media/fingerprint.js";
import { probe } from "../../media/probe.js";
import { findSourceFile, mediaPaths } from "../../media/storage.js";
import { findMedia, markReady, saveFingerprint, saveProbeResult, setStatus } from "../../services/media-service.js";
import { dispatchEvent } from "../../services/webhook-service.js";
import type { JobContext } from "../runner.js";

export interface ProcessMediaPayload {
  mediaId: string;
  userId: string;
}

/** Stage boundaries, so the bar moves once from 0 to 1 across the whole job. */
const STAGES = {
  probing: [0, 0.05],
  converting: [0.05, 0.55],
  packaging: [0.55, 0.8],
  storyboard: [0.8, 0.92],
  fingerprint: [0.92, 1],
} as const;

type Stage = keyof typeof STAGES;

export async function processMedia({ payload, signal, progress }: JobContext<ProcessMediaPayload>): Promise<void> {
  const { mediaId, userId } = payload;

  const report = (stage: Stage, fraction: number) => {
    const [from, to] = STAGES[stage];
    progress(stage, from + (to - from) * fraction);
  };

  const announce = (status: MediaStatus, message: string) => {
    const media = findMedia(mediaId);
    mediaEvents.publish({
      userId,
      mediaId,
      status,
      progress: 0,
      title: media?.title ?? "Video",
      message,
    });
  };

  const sourcePath = findSourceFile(mediaId);
  if (!sourcePath) throw new Error("The uploaded file is missing from storage");

  setStatus(mediaId, "probing");
  announce("probing", "Reading video details");

  const source = await probe(sourcePath);
  saveProbeResult(mediaId, source);
  report("probing", 1);

  const needsConversion = !isUniversallyPlayable(source);

  setStatus(mediaId, "transcoding");
  announce(
    "transcoding",
    needsConversion ? "Converting to a format every device can play" : "Preparing for streaming",
  );

  if (needsConversion) {
    await transcodeToUniversalMp4(sourcePath, mediaId, source, (fraction) => report("converting", fraction), signal);
  } else {
    await remuxToMp4(sourcePath, mediaId, signal);
    report("converting", 1);
  }

  if (signal.aborted) return;

  const deliveryPath = mediaPaths.delivery(mediaId);

  const hasHls = await packageHls(deliveryPath, mediaId, source, (fraction) => report("packaging", fraction), signal);
  if (!hasHls) logger.warn("hls packaging skipped", { mediaId });
  report("packaging", 1);

  if (signal.aborted) return;

  const hasPoster = await extractPoster(deliveryPath, mediaId, source.durationSeconds);
  const hasSprite = await generateStoryboard(deliveryPath, mediaId, source, signal);
  report("storyboard", 1);

  const phash = await fingerprintVideo(deliveryPath, source.durationSeconds);
  const duplicateOf = phash ? saveFingerprint(mediaId, userId, phash) : null;
  report("fingerprint", 1);

  markReady(mediaId, { wasConverted: needsConversion, hasHls, hasPoster, hasSprite });

  announce("ready", needsConversion ? "Converted and ready to share" : "Ready to share");
  dispatchEvent(userId, "video.ready", {
    mediaId,
    converted: needsConversion,
    sourceCodec: source.videoCodec,
    duplicateOf,
  });

  logger.info("media ready", {
    mediaId,
    converted: needsConversion,
    hls: hasHls,
    storyboard: hasSprite,
    duplicateOf,
  });
}

export function announceFailure(mediaId: string, userId: string, message: string): void {
  setStatus(mediaId, "failed", message);
  const media = findMedia(mediaId);

  mediaEvents.publish({
    userId,
    mediaId,
    status: "failed",
    progress: 0,
    title: media?.title ?? "Video",
    message,
  });

  dispatchEvent(userId, "video.failed", { mediaId, error: message });
}
