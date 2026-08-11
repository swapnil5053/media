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

export class FfmpegError extends Error {
  constructor(message: string, readonly detail: string) {
    super(message);
    this.name = "FfmpegError";
  }
}

interface RunOptions {
  durationSeconds?: number;
  onProgress?: ProgressHandler;
  signal?: AbortSignal;
  captureStdout?: boolean;
}

function runFfmpeg(args: string[], options: RunOptions = {}): Promise<Buffer> {
  const { durationSeconds = 0, onProgress, signal, captureStdout = false } = options;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new FfmpegError("Cancelled before starting", ""));
      return;
    }

    const child = spawn("ffmpeg", ["-hide_banner", "-nostdin", "-y", ...args]);
    const stderr: string[] = [];
    const stdout: Buffer[] = [];

    const onAbort = () => child.kill("SIGKILL");
    signal?.addEventListener("abort", onAbort, { once: true });

    child.stdout.on("data", (chunk: Buffer) => {
      if (captureStdout) {
        stdout.push(chunk);
        return;
      }
      if (!onProgress || durationSeconds <= 0) return;

      for (const line of chunk.toString().split("\n")) {
        const [key, value] = line.split("=");
        if (key !== "out_time_us" || !value) continue;

        const seconds = Number(value) / 1_000_000;
        if (Number.isFinite(seconds)) onProgress(Math.min(1, Math.max(0, seconds / durationSeconds)));
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr.push(chunk.toString());
      if (stderr.length > 40) stderr.shift();
    });

    child.on("error", (error) => {
      signal?.removeEventListener("abort", onAbort);
      reject(new FfmpegError("ffmpeg is not available on this machine", String(error)));
    });

    child.on("close", (code) => {
      signal?.removeEventListener("abort", onAbort);

      if (signal?.aborted) {
        reject(new FfmpegError("Cancelled", ""));
        return;
      }
      if (code === 0) {
        onProgress?.(1);
        resolve(Buffer.concat(stdout));
        return;
      }
      reject(new FfmpegError("The video could not be converted", stderr.join("").slice(-2000)));
    });
  });
}

function progressArgs(capture: boolean): string[] {
  return capture ? [] : ["-progress", "pipe:1", "-nostats"];
}

export async function transcodeToUniversalMp4(
  input: string,
  mediaId: string,
  source: MediaSource,
  onProgress: ProgressHandler,
  signal?: AbortSignal,
): Promise<string> {
  const output = mediaPaths.delivery(mediaId);
  const audioArgs = source.audioCodec ? AAC_ARGS : ["-an"];

  await runFfmpeg(
    ["-i", input, "-vf", FIT_1080P, ...H264_ARGS, ...audioArgs, "-movflags", "+faststart", ...progressArgs(false), output],
    { durationSeconds: source.durationSeconds, onProgress, signal },
  );

  return output;
}

/** Copies an already-compatible upload into place instead of burning CPU on it. */
export async function remuxToMp4(input: string, mediaId: string, signal?: AbortSignal): Promise<string> {
  const output = mediaPaths.delivery(mediaId);
  await runFfmpeg(["-i", input, "-c", "copy", "-movflags", "+faststart", output], { signal });
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
    ]);
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
 * source height are skipped so nothing is upscaled.
 */
export async function packageHls(
  input: string,
  mediaId: string,
  source: MediaSource,
  onProgress: ProgressHandler,
  signal?: AbortSignal,
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
    if (hasAudio) args.push("-map", "a:0", `-c:a:${index}`, "aac", `-b:a:${index}`, "128k", "-ac", "2");
  });

  const streamMap = renditions.map((_, index) => (hasAudio ? `v:${index},a:${index}` : `v:${index}`)).join(" ");

  args.push(
    "-f", "hls",
    "-hls_time", "4",
    "-hls_playlist_type", "vod",
    "-hls_flags", "independent_segments",
    "-hls_segment_filename", path.join(outputDir, "v%v_%03d.ts"),
    "-master_pl_name", "master.m3u8",
    "-var_stream_map", streamMap,
    ...progressArgs(false),
    path.join(outputDir, "v%v.m3u8"),
  );

  try {
    await runFfmpeg(args, { durationSeconds: source.durationSeconds, onProgress, signal });
    return fs.existsSync(mediaPaths.hlsMaster(mediaId));
  } catch (error) {
    fs.rmSync(outputDir, { recursive: true, force: true });
    if (signal?.aborted) throw error;
    return false;
  }
}

export const STORYBOARD = { columns: 5, rows: 5, tileWidth: 160 } as const;

/**
 * One sprite sheet of evenly spaced frames plus a WebVTT index, which is how
 * players show a preview while you drag along the timeline.
 */
export async function generateStoryboard(
  input: string,
  mediaId: string,
  source: MediaSource,
  signal?: AbortSignal,
): Promise<boolean> {
  const tiles = STORYBOARD.columns * STORYBOARD.rows;
  const duration = Math.max(source.durationSeconds, 1);
  const interval = duration / tiles;
  const aspect = source.width > 0 ? source.height / source.width : 9 / 16;
  const tileHeight = Math.max(2, Math.round((STORYBOARD.tileWidth * aspect) / 2) * 2);

  try {
    await runFfmpeg(
      [
        "-i", input,
        "-vf",
        `fps=${(1 / interval).toFixed(6)},scale=${STORYBOARD.tileWidth}:${tileHeight},tile=${STORYBOARD.columns}x${STORYBOARD.rows}`,
        "-frames:v", "1",
        "-q:v", "5",
        mediaPaths.sprite(mediaId),
      ],
      { signal },
    );

    const cues = Array.from({ length: tiles }, (_, index) => {
      const start = index * interval;
      const end = Math.min(duration, start + interval);
      const x = (index % STORYBOARD.columns) * STORYBOARD.tileWidth;
      const y = Math.floor(index / STORYBOARD.columns) * tileHeight;
      return `${timecode(start)} --> ${timecode(end)}\nsprite.jpg#xywh=${x},${y},${STORYBOARD.tileWidth},${tileHeight}`;
    });

    fs.writeFileSync(mediaPaths.storyboardVtt(mediaId), `WEBVTT\n\n${cues.join("\n\n")}\n`);
    return fs.existsSync(mediaPaths.sprite(mediaId));
  } catch {
    return false;
  }
}

function timecode(seconds: number): string {
  const whole = Math.floor(seconds);
  const ms = Math.round((seconds - whole) * 1000);
  const hh = String(Math.floor(whole / 3600)).padStart(2, "0");
  const mm = String(Math.floor((whole % 3600) / 60)).padStart(2, "0");
  const ss = String(whole % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}.${String(ms).padStart(3, "0")}`;
}

/**
 * Raw 9x8 greyscale frames sampled across the video, used to build a perceptual
 * hash. Raw video avoids pulling in an image decoder just to read pixels.
 */
export async function sampleGrayscaleFrames(
  input: string,
  durationSeconds: number,
  frameCount: number,
  width: number,
  height: number,
): Promise<Buffer[]> {
  const interval = Math.max(durationSeconds / (frameCount + 1), 0.2);

  const raw = await runFfmpeg(
    [
      "-i", input,
      "-vf", `fps=${(1 / interval).toFixed(6)},scale=${width}:${height},format=gray`,
      "-frames:v", String(frameCount),
      "-f", "rawvideo",
      "-pix_fmt", "gray",
      "pipe:1",
    ],
    { captureStdout: true },
  );

  const frameSize = width * height;
  const frames: Buffer[] = [];
  for (let offset = 0; offset + frameSize <= raw.length; offset += frameSize) {
    frames.push(raw.subarray(offset, offset + frameSize));
  }

  return frames;
}
