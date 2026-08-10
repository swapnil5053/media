import type { CompatibilityReport, CompatibilityTarget, MediaSource } from "@shared/types.js";

const DELIVERY = { container: "mp4", videoCodec: "h264", audioCodec: "aac", isHdr: false };

const CODEC_LABELS: Record<string, string> = {
  h264: "H.264",
  hevc: "HEVC",
  h265: "HEVC",
  vp9: "VP9",
  av1: "AV1",
  prores: "ProRes",
  mpeg4: "MPEG-4 Part 2",
  vp8: "VP8",
  wmv3: "WMV",
};

const AUDIO_LABELS: Record<string, string> = {
  aac: "AAC",
  mp3: "MP3",
  opus: "Opus",
  pcm_s16le: "PCM",
  ac3: "Dolby Digital",
  eac3: "Dolby Digital Plus",
  alac: "ALAC",
  vorbis: "Vorbis",
};

export const codecLabel = (codec: string) => CODEC_LABELS[codec] ?? codec.toUpperCase();
const audioLabel = (codec: string | null) => (codec ? (AUDIO_LABELS[codec] ?? codec.toUpperCase()) : "no audio");

export function formatLabel(input: { container: string; videoCodec: string; audioCodec: string | null }): string {
  return `${input.container.toUpperCase()} · ${codecLabel(input.videoCodec)} · ${audioLabel(input.audioCodec)}`;
}

/**
 * The compatibility matrix behind the product's core promise. Each target is a
 * real-world playback surface with the codecs it can decode natively; anything
 * outside that list is why a video "just won't open" for the person you sent it to.
 */
const TARGETS = [
  {
    id: "android-chrome",
    label: "Android (Chrome)",
    video: ["h264", "vp9", "av1", "vp8"],
    audio: ["aac", "mp3", "opus", "vorbis"],
    containers: ["mp4", "webm", "mkv"],
    hdr: true,
  },
  {
    id: "iphone-safari",
    label: "iPhone (Safari)",
    video: ["h264", "hevc", "h265"],
    audio: ["aac", "mp3", "alac"],
    containers: ["mp4", "mov", "m4v"],
    hdr: true,
  },
  {
    id: "desktop-chrome",
    label: "Chrome & Edge",
    video: ["h264", "vp9", "av1", "vp8"],
    audio: ["aac", "mp3", "opus", "vorbis"],
    containers: ["mp4", "webm", "mkv"],
    hdr: true,
  },
  {
    id: "firefox",
    label: "Firefox",
    video: ["h264", "vp9", "av1", "vp8"],
    audio: ["aac", "mp3", "opus", "vorbis"],
    containers: ["mp4", "webm"],
    hdr: true,
  },
  {
    id: "windows-safari",
    label: "Safari (macOS)",
    video: ["h264", "hevc", "h265"],
    audio: ["aac", "mp3", "alac"],
    containers: ["mp4", "mov", "m4v"],
    hdr: true,
  },
  {
    id: "smart-tv",
    label: "Smart TVs & consoles",
    video: ["h264"],
    audio: ["aac", "mp3", "ac3"],
    containers: ["mp4"],
    hdr: false,
  },
] as const;

function evaluate(input: {
  container: string;
  videoCodec: string;
  audioCodec: string | null;
  isHdr: boolean;
}): CompatibilityTarget[] {
  return TARGETS.map((target) => {
    const videoOk = (target.video as readonly string[]).includes(input.videoCodec);
    const audioOk = input.audioCodec === null || (target.audio as readonly string[]).includes(input.audioCodec);
    const containerOk = (target.containers as readonly string[]).includes(input.container);
    const hdrOk = !input.isHdr || target.hdr;

    let reason = "Plays natively";
    if (!videoOk) reason = `Cannot decode ${codecLabel(input.videoCodec)} video`;
    else if (!audioOk) reason = `Cannot decode ${audioLabel(input.audioCodec)} audio`;
    else if (!containerOk) reason = `Does not open .${input.container} files`;
    else if (!hdrOk) reason = "HDR colour renders incorrectly";

    return {
      id: target.id,
      label: target.label,
      supported: videoOk && audioOk && containerOk && hdrOk,
      reason,
    };
  });
}

const score = (targets: CompatibilityTarget[]) =>
  Math.round((targets.filter((target) => target.supported).length / targets.length) * 100);

export function buildReport(source: MediaSource): CompatibilityReport {
  const sourceTargets = evaluate(source);
  const deliveryTargets = evaluate({ ...DELIVERY, audioCodec: source.audioCodec ? "aac" : null });
  const blocked = sourceTargets.filter((target) => !target.supported);

  const summary =
    blocked.length === 0
      ? "This file already played everywhere. We kept it as-is and packaged it for streaming."
      : `${codecLabel(source.videoCodec)} in a .${source.container} container would not open on ${blocked
          .map((target) => target.label)
          .join(", ")}. The delivered copy plays everywhere.`;

  return {
    sourceLabel: formatLabel(source),
    deliveryLabel: `MP4 · H.264 · ${source.audioCodec ? "AAC" : "no audio"}`,
    sourceScore: score(sourceTargets),
    deliveryScore: score(deliveryTargets),
    targets: sourceTargets,
    summary,
  };
}

/** True when the file can be served untouched and still play on every target. */
export function isUniversallyPlayable(source: MediaSource): boolean {
  return evaluate(source).every((target) => target.supported);
}
