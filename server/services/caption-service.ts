import fs from "node:fs";
import { nanoid } from "nanoid";
import type { CaptionTrack } from "@shared/types.js";
import { db } from "../db/index.js";
import { badRequest } from "../lib/errors.js";
import { mediaPaths } from "../media/storage.js";

const TIMING = /^(\d{1,2}:)?\d{1,2}:\d{2}[,.]\d{1,3}\s*-->\s*(\d{1,2}:)?\d{1,2}:\d{2}[,.]\d{1,3}/;

/**
 * SubRip is what people have on disk; WebVTT is what browsers accept. The two
 * formats differ by a header, a comma, and the numeric counter before each cue.
 */
export function srtToVtt(input: string): { vtt: string; cueCount: number } {
  const normalised = input.replace(/^﻿/, "").replace(/\r\n?/g, "\n").trim();
  if (normalised.length === 0) throw badRequest("That subtitle file is empty.");

  if (normalised.startsWith("WEBVTT")) {
    return { vtt: `${normalised}\n`, cueCount: normalised.split("\n").filter((line) => TIMING.test(line)).length };
  }

  const lines: string[] = [];
  let cueCount = 0;

  for (const block of normalised.split(/\n{2,}/)) {
    const blockLines = block.split("\n");
    // Drop the SubRip sequence number when the cue keeps its own timing line.
    const start = blockLines[0] !== undefined && /^\d+$/.test(blockLines[0].trim()) ? 1 : 0;
    const timing = blockLines[start];
    if (!timing || !TIMING.test(timing)) continue;

    const text = blockLines.slice(start + 1).join("\n").trim();
    if (!text) continue;

    lines.push(timing.replace(/,/g, "."), text, "");
    cueCount += 1;
  }

  if (cueCount === 0) throw badRequest("We could not find any subtitles in that file.");

  return { vtt: `WEBVTT\n\n${lines.join("\n")}`, cueCount };
}

export function addCaption(input: {
  mediaId: string;
  label: string;
  language: string;
  content: string;
}): CaptionTrack {
  const { vtt, cueCount } = srtToVtt(input.content);
  const id = nanoid(10);

  fs.mkdirSync(mediaPaths.captionsDir(input.mediaId), { recursive: true });
  fs.writeFileSync(mediaPaths.caption(input.mediaId, id), vtt, "utf8");

  db.prepare(
    `INSERT INTO captions (id, media_id, label, language, cue_count, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, input.mediaId, input.label, input.language, cueCount, new Date().toISOString());

  return { id, label: input.label, language: input.language, url: `/api/stream/${input.mediaId}/captions/${id}.vtt` };
}

export function deleteCaption(mediaId: string, captionId: string): void {
  db.prepare(`DELETE FROM captions WHERE id = ? AND media_id = ?`).run(captionId, mediaId);
  fs.rmSync(mediaPaths.caption(mediaId, captionId), { force: true });
}
