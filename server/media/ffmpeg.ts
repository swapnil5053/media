import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { MediaSource } from "@shared/types.js";
import { mediaPaths } from "./storage.js";

export type ProgressHandler = (fraction: number) => void;

/** Everything is normalised to this profile — the widest set of decoders in the wild. */
const H264_ARGS = [
  "-c:v", "libx264",
  "-profile:v", "high",
  "-level", "4.0",
  "-preset", "veryfast",
  "-crf", "23",
  "-pix_fmt", "yuv420p",
];

const AAC_ARGS = ["-c:a", "aac", "-b:a", "128k", "-ac", "2"];

/** Fits inside a 1080p box without ever upscaling, and keeps dimensions even for H.264. */
const FIT_1080P =
  "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2";

class FfmpegError extends Error {
  constructor(message: string, readonly detail: string) {
    super(message);
    this.name = "FfmpegError";
  }
}

function runFfmpeg(args: string[], durationSeconds: number, onProgress?: ProgressHandler): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-hide_banner", "-nostdin", "-y", ...args, "-progress", "pipe:1", "-nostats"]);
    const stderr: string[] = [];

    child.stdout.on("data", (chunk: Buffer) => {
      if (!onProgress || durationSeconds <= 0) return;

      for (const line of chunk.toString().split("\n")) {
        const [key, value] = line.split("=");
        if (key !== "out_time_us" || !value) continue;

        const seconds = Number(value) / 1_000_000;
        if (Number.isFinite(seconds)) {
          onProgress(Math.min(1, Math.max(0, seconds / durationSeconds)));
        }
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr.push(chunk.toString());
      if (stderr.length > 40) stderr.shift();
    });

    child.on("error", (error) => reject(new FfmpegError("ffmpeg is not available on this machine", String(error))));
    child.on("close", (code) => {
      if (code === 0) {
        onProgress?.(1);
        resolve();
        return;
      }
      reject(new FfmpegError("The video could not be converted", stderr.join("").slice(-2000)));
    });
  });
}

export async function transcodeToUniversalMp4(
  input: string,
  mediaId: string,
  source: MediaSource,
  onProgress: ProgressHandler,
): Promise<string> {
  const output = mediaPaths.delivery(mediaId);
  const audioArgs = source.audioCodec ? AAC_ARGS : ["-an"];

  await runFfmpeg(
    ["-i", input, "-vf", FIT_1080P, ...H264_ARGS, ...audioArgs, "-movflags", "+faststart", output],
    source.durationSeconds,
    onProgress,
  );

  return output;
}

/** Copies an already-compatible upload into place instead of burning CPU on it. */
export async function remuxToMp4(input: string, mediaId: string, source: MediaSource): Promise<string> {
  const output = mediaPaths.delivery(mediaId);
  await runFfmpeg(["-i", input, "-c", "copy", "-movflags", "+faststart", output], source.durationSeconds);
  return output;
}

export async function extractPoster(input: string, mediaId: string, durationSeconds: number): Promise<boolean> {
  const output = mediaPaths.poster(mediaId);
  const seek = durationSeconds > 4 ? Math.min(durationSeconds * 0.1, 10) : 0;

  try {
    await runFfmpeg([
      "-ss", seek.toFixed(2),
      "-i", input,
      "-frames:v", "1",
      "-vf", "scale='min(1280,iw)':-2",
      "-q:v", "4",
      output,
    ], 0);
    return fs.existsSync(output);
  } catch {
    return false;
  }
}

interface Rendition {
  height: number;
  bitrate: string;
  maxrate: string;
  bufsize: string;
}

const LADDER: Rendition[] = [
  { height: 1080, bitrate: "4200k", maxrate: "4500k", bufsize: "8400k" },
  { height: 720, bitrate: "2400k", maxrate: "2600k", bufsize: "4800k" },
  { height: 360, bitrate: "700k", maxrate: "800k", bufsize: "1400k" },
];

/**
 * Packages an adaptive ladder from the normalised MP4. Renditions above the
 * source height are skipped so nothing is upscaled, and a single-rendition
 * playlist is still produced for small clips.
 */
export async function packageHls(
  input: string,
  mediaId: string,
  source: MediaSource,
  onProgress: ProgressHandler,
): Promise<boolean> {
  const deliveredHeight = Math.min(source.height || 1080, 1080);
  const renditions = LADDER.filter((rendition) => rendition.height <= deliveredHeight);
  if (renditions.length === 0) renditions.push({ ...LADDER[LADDER.length - 1]!, height: deliveredHeight });

  const outputDir = mediaPaths.hlsDir(mediaId);
  fs.mkdirSync(outputDir, { recursive: true });

  const hasAudio = source.audioCodec !== null;
  const filters = renditions
    .map((rendition, index) => `[v${index}]scale=-2:${rendition.height}[v${index}out]`)
    .join(";");
  const split = `[0:v]split=${renditions.length}${renditions.map((_, index) => `[v${index}]`).join("")}`;

  const args = ["-i", input, "-filter_complex", `${split};${filters}`];

  renditions.forEach((rendition, index) => {
    args.push(
      "-map", `[v${index}out]`,
      `-c:v:${index}`, "libx264",
      "-preset", "veryfast",
      `-b:v:${index}`, rendition.bitrate,
      `-maxrate:v:${index}`, rendition.maxrate,
      `-bufsize:v:${index}`, rendition.bufsize,
      "-pix_fmt", "yuv420p",
      "-g", "48",
      "-keyint_min", "48",
      "-sc_threshold", "0",
    );
    if (hasAudio) {
      args.push("-map", "a:0", `-c:a:${index}`, "aac", `-b:a:${index}`, "128k", "-ac", "2");
    }
  });

  const streamMap = renditions
    .map((_, index) => (hasAudio ? `v:${index},a:${index}` : `v:${index}`))
    .join(" ");

  args.push(
    "-f", "hls",
    "-hls_time", "4",
    "-hls_playlist_type", "vod",
    "-hls_flags", "independent_segments",
    "-hls_segment_filename", path.join(outputDir, "v%v_%03d.ts"),
    "-master_pl_name", "master.m3u8",
    "-var_stream_map", streamMap,
    path.join(outputDir, "v%v.m3u8"),
  );

  try {
    await runFfmpeg(args, source.durationSeconds, onProgress);
    return fs.existsSync(mediaPaths.hlsMaster(mediaId));
  } catch {
    fs.rmSync(outputDir, { recursive: true, force: true });
    return false;
  }
}
