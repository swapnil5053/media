import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";

export const mediaPaths = {
  dir: (mediaId: string) => path.join(config.mediaDir, mediaId),
  source: (mediaId: string, extension: string) => path.join(config.mediaDir, mediaId, `source${extension}`),
  delivery: (mediaId: string) => path.join(config.mediaDir, mediaId, "delivery.mp4"),
  poster: (mediaId: string) => path.join(config.mediaDir, mediaId, "poster.jpg"),
  hlsDir: (mediaId: string) => path.join(config.mediaDir, mediaId, "hls"),
  hlsMaster: (mediaId: string) => path.join(config.mediaDir, mediaId, "hls", "master.m3u8"),
  sprite: (mediaId: string) => path.join(config.mediaDir, mediaId, "sprite.jpg"),
  storyboardVtt: (mediaId: string) => path.join(config.mediaDir, mediaId, "storyboard.vtt"),
  captionsDir: (mediaId: string) => path.join(config.mediaDir, mediaId, "captions"),
  caption: (mediaId: string, captionId: string) =>
    path.join(config.mediaDir, mediaId, "captions", `${captionId}.vtt`),
};

export function findSourceFile(mediaId: string): string | null {
  const dir = mediaPaths.dir(mediaId);
  if (!fs.existsSync(dir)) return null;

  const match = fs.readdirSync(dir).find((name) => name.startsWith("source."));
  return match ? path.join(dir, match) : null;
}

export function directorySize(dir: string): number {
  if (!fs.existsSync(dir)) return 0;

  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    total += entry.isDirectory() ? directorySize(full) : fs.statSync(full).size;
  }
  return total;
}

export function removeMediaFiles(mediaId: string): void {
  fs.rmSync(mediaPaths.dir(mediaId), { recursive: true, force: true });
}

/**
 * Segment names come out of the HLS playlist, so they are resolved against the
 * media directory and rejected if they try to escape it.
 */
export function resolveInsideMediaDir(mediaId: string, relativePath: string): string | null {
  const root = mediaPaths.dir(mediaId);
  const resolved = path.resolve(root, relativePath);
  return resolved.startsWith(path.resolve(root) + path.sep) ? resolved : null;
}
