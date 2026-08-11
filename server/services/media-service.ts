import fs from "node:fs";
import { nanoid } from "nanoid";
import type { AccountUsage, CaptionTrack, Media, MediaSource, MediaStatus } from "@shared/types.js";
import { PLANS, type PlanId } from "@shared/types.js";
import { db } from "../db/index.js";
import { conflict, payloadTooLarge } from "../lib/errors.js";
import { buildReport } from "../media/compatibility.js";
import { isNearDuplicate } from "../media/fingerprint.js";
import { directorySize, mediaPaths, removeMediaFiles } from "../media/storage.js";

interface MediaRow {
  id: string;
  user_id: string;
  title: string;
  original_filename: string;
  status: MediaStatus;
  error: string | null;
  size_bytes: number;
  source_container: string | null;
  source_video_codec: string | null;
  source_audio_codec: string | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  duration_seconds: number | null;
  bitrate: number | null;
  is_hdr: number;
  rotation: number;
  was_converted: number;
  delivery_size_bytes: number | null;
  stored_bytes: number | null;
  has_hls: number;
  has_poster: number;
  has_sprite: number;
  phash: string | null;
  duplicate_of: string | null;
  created_at: string;
  ready_at: string | null;
  progress: number | null;
  duplicate_title: string | null;
}

const SELECT_MEDIA = `
  SELECT m.*,
    (SELECT j.progress FROM job_queue j WHERE j.media_id = m.id ORDER BY j.created_at DESC LIMIT 1) AS progress,
    (SELECT d.title FROM media d WHERE d.id = m.duplicate_of) AS duplicate_title
  FROM media m
`;

function toSource(row: MediaRow): MediaSource | null {
  if (!row.source_video_codec || !row.source_container) return null;

  return {
    container: row.source_container,
    videoCodec: row.source_video_codec,
    audioCodec: row.source_audio_codec,
    width: row.width ?? 0,
    height: row.height ?? 0,
    fps: row.fps ?? 0,
    durationSeconds: row.duration_seconds ?? 0,
    bitrate: row.bitrate ?? 0,
    isHdr: row.is_hdr === 1,
    rotation: row.rotation,
  };
}

export function listCaptions(mediaId: string): CaptionTrack[] {
  const rows = db
    .prepare(`SELECT id, label, language FROM captions WHERE media_id = ? ORDER BY created_at`)
    .all(mediaId) as Array<{ id: string; label: string; language: string }>;

  return rows.map((row) => ({ ...row, url: `/api/stream/${mediaId}/captions/${row.id}.vtt` }));
}

export function toMedia(row: MediaRow): Media {
  const source = toSource(row);

  return {
    id: row.id,
    title: row.title,
    originalFilename: row.original_filename,
    status: row.status,
    error: row.error,
    sizeBytes: row.size_bytes,
    deliverySizeBytes: row.delivery_size_bytes,
    hasHls: row.has_hls === 1,
    hasStoryboard: row.has_sprite === 1,
    posterUrl: row.has_poster === 1 ? `/api/media/${row.id}/poster` : null,
    spriteUrl: row.has_sprite === 1 ? `/api/media/${row.id}/sprite` : null,
    source,
    wasConverted: row.was_converted === 1,
    compatibility: source ? buildReport(source) : null,
    duplicateOf: row.duplicate_of && row.duplicate_title ? { id: row.duplicate_of, title: row.duplicate_title } : null,
    captions: listCaptions(row.id),
    progress: row.status === "ready" ? 1 : (row.progress ?? 0),
    createdAt: row.created_at,
    readyAt: row.ready_at,
  };
}

export function listMedia(userId: string): Media[] {
  const rows = db
    .prepare(`${SELECT_MEDIA} WHERE m.user_id = ? ORDER BY m.created_at DESC`)
    .all(userId) as MediaRow[];
  return rows.map(toMedia);
}

export function findMedia(mediaId: string): (Media & { userId: string }) | null {
  const row = db.prepare(`${SELECT_MEDIA} WHERE m.id = ?`).get(mediaId) as MediaRow | undefined;
  return row ? { ...toMedia(row), userId: row.user_id } : null;
}

export function getUsage(userId: string): AccountUsage {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS videos,
              COALESCE(SUM(COALESCE(stored_bytes, size_bytes)), 0) AS stored,
              COALESCE(SUM(MAX(0, size_bytes - COALESCE(delivery_size_bytes, size_bytes))), 0) AS saved
       FROM media WHERE user_id = ?`,
    )
    .get(userId) as { videos: number; stored: number; saved: number };

  return { videos: row.videos, storageBytes: row.stored, bytesSaved: row.saved };
}

function formatLimit(bytes: number): string {
  const gb = bytes / 1024 ** 3;
  return gb >= 1 ? `${gb} GB` : `${Math.round(bytes / 1024 ** 2)} MB`;
}

export function assertWithinQuota(userId: string, plan: PlanId, incomingBytes: number): void {
  const limits = PLANS[plan];
  const usage = getUsage(userId);

  if (incomingBytes > limits.maxUploadBytes) {
    throw payloadTooLarge(`Files on the ${limits.name} plan are limited to ${formatLimit(limits.maxUploadBytes)}.`);
  }
  if (usage.videos >= limits.maxVideos) {
    throw conflict(`The ${limits.name} plan holds ${limits.maxVideos} videos. Delete one or upgrade.`, "quota_videos");
  }
  if (usage.storageBytes + incomingBytes > limits.maxStorageBytes) {
    throw conflict(`This upload would exceed your ${formatLimit(limits.maxStorageBytes)} of storage.`, "quota_storage");
  }
}

export function createMedia(input: {
  userId: string;
  title: string;
  originalFilename: string;
  sizeBytes: number;
}): string {
  const id = nanoid(12);
  db.prepare(
    `INSERT INTO media (id, user_id, title, original_filename, status, size_bytes, created_at)
     VALUES (?, ?, ?, ?, 'queued', ?, ?)`,
  ).run(id, input.userId, input.title, input.originalFilename, input.sizeBytes, new Date().toISOString());
  return id;
}

export function saveProbeResult(mediaId: string, source: MediaSource): void {
  db.prepare(
    `UPDATE media SET source_container = ?, source_video_codec = ?, source_audio_codec = ?,
       width = ?, height = ?, fps = ?, duration_seconds = ?, bitrate = ?, is_hdr = ?, rotation = ?
     WHERE id = ?`,
  ).run(
    source.container,
    source.videoCodec,
    source.audioCodec,
    source.width,
    source.height,
    source.fps,
    source.durationSeconds,
    source.bitrate,
    source.isHdr ? 1 : 0,
    source.rotation,
    mediaId,
  );
}

/**
 * Compares a new fingerprint against the rest of the account's library. Matching
 * is done in memory because Hamming distance is not something SQLite can index.
 */
export function saveFingerprint(mediaId: string, userId: string, phash: string): string | null {
  const others = db
    .prepare(`SELECT id, phash FROM media WHERE user_id = ? AND id != ? AND phash IS NOT NULL`)
    .all(userId, mediaId) as Array<{ id: string; phash: string }>;

  const match = others.find((candidate) => isNearDuplicate(phash, candidate.phash));

  db.prepare(`UPDATE media SET phash = ?, duplicate_of = ? WHERE id = ?`).run(phash, match?.id ?? null, mediaId);
  return match?.id ?? null;
}

export function markReady(
  mediaId: string,
  input: { wasConverted: boolean; hasHls: boolean; hasPoster: boolean; hasSprite: boolean },
): void {
  // Two different numbers: what a viewer downloads, and what we keep on disk.
  const deliveryBytes = fs.existsSync(mediaPaths.delivery(mediaId))
    ? fs.statSync(mediaPaths.delivery(mediaId)).size
    : null;

  db.prepare(
    `UPDATE media SET status = 'ready', error = NULL, was_converted = ?, has_hls = ?, has_poster = ?, has_sprite = ?,
       delivery_size_bytes = ?, stored_bytes = ?, ready_at = ? WHERE id = ?`,
  ).run(
    input.wasConverted ? 1 : 0,
    input.hasHls ? 1 : 0,
    input.hasPoster ? 1 : 0,
    input.hasSprite ? 1 : 0,
    deliveryBytes,
    directorySize(mediaPaths.dir(mediaId)),
    new Date().toISOString(),
    mediaId,
  );
}

export function setStatus(mediaId: string, status: MediaStatus, error?: string): void {
  db.prepare(`UPDATE media SET status = ?, error = ? WHERE id = ?`).run(status, error ?? null, mediaId);
}

export function deleteMedia(mediaId: string): void {
  db.prepare(`UPDATE media SET duplicate_of = NULL WHERE duplicate_of = ?`).run(mediaId);
  db.prepare(`DELETE FROM media WHERE id = ?`).run(mediaId);
  removeMediaFiles(mediaId);
}

export function renameMedia(mediaId: string, title: string): void {
  db.prepare(`UPDATE media SET title = ? WHERE id = ?`).run(title, mediaId);
}
