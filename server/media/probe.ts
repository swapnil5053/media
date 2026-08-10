import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import type { MediaSource } from "@shared/types.js";

const run = promisify(execFile);

interface ProbeStream {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  r_frame_rate?: string;
  color_transfer?: string;
  color_primaries?: string;
  side_data_list?: Array<{ rotation?: number }>;
  tags?: Record<string, string>;
}

function parseFrameRate(value: string | undefined): number {
  if (!value) return 0;
  const [numerator, denominator] = value.split("/");
  const top = Number(numerator);
  const bottom = denominator === undefined ? 1 : Number(denominator);
  if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom === 0) return 0;
  return Math.round((top / bottom) * 100) / 100;
}

function parseRotation(stream: ProbeStream): number {
  const fromSideData = stream.side_data_list?.find((entry) => entry.rotation !== undefined)?.rotation;
  const fromTags = stream.tags?.rotate;
  const raw = fromSideData ?? (fromTags ? Number(fromTags) : 0);
  return Number.isFinite(raw) ? ((Math.round(raw) % 360) + 360) % 360 : 0;
}

export async function probe(filePath: string): Promise<MediaSource> {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    filePath,
  ]);

  const data = JSON.parse(stdout) as { streams?: ProbeStream[]; format?: Record<string, string> };
  const video = data.streams?.find((stream) => stream.codec_type === "video");
  const audio = data.streams?.find((stream) => stream.codec_type === "audio");

  if (!video) {
    throw new Error("That file does not contain a video track.");
  }

  const transfer = video.color_transfer ?? "";
  const rotation = parseRotation(video);
  const rotated = rotation === 90 || rotation === 270;
  const width = video.width ?? 0;
  const height = video.height ?? 0;

  return {
    container: path.extname(filePath).replace(".", "").toLowerCase(),
    videoCodec: (video.codec_name ?? "unknown").toLowerCase(),
    audioCodec: audio?.codec_name?.toLowerCase() ?? null,
    width: rotated ? height : width,
    height: rotated ? width : height,
    fps: parseFrameRate(video.r_frame_rate),
    durationSeconds: Number(data.format?.duration ?? 0),
    bitrate: Number(data.format?.bit_rate ?? 0),
    isHdr: transfer === "smpte2084" || transfer === "arib-std-b67",
    rotation,
  };
}
