import type { AnalyticsSummary } from "@shared/types.js";
import { db } from "../db/index.js";
import { viewerFingerprint } from "../lib/crypto.js";

export type PlaybackEventType = "start" | "progress" | "complete";

/** Deliberately coarse: enough to answer "what were people watching on", nothing more. */
export function deviceFromUserAgent(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "Tablet";
  if (/iphone|ipod/.test(ua)) return "iPhone";
  if (/android/.test(ua)) return /mobile/.test(ua) ? "Android phone" : "Android tablet";
  if (/macintosh|mac os x/.test(ua)) return "Mac";
  if (/windows/.test(ua)) return "Windows";
  if (/linux/.test(ua)) return "Linux";
  if (/smarttv|tizen|webos|appletv/.test(ua)) return "TV";
  return "Other";
}

export function recordEvent(input: {
  mediaId: string;
  shareId: string | null;
  type: PlaybackEventType;
  percent: number;
  seconds: number;
  ip: string;
  userAgent: string;
}): void {
  db.prepare(
    `INSERT INTO playback_events (media_id, share_id, type, percent, seconds, viewer_hash, device, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.mediaId,
    input.shareId,
    input.type,
    Math.min(1, Math.max(0, input.percent)),
    Math.max(0, input.seconds),
    viewerFingerprint(input.ip, input.userAgent),
    deviceFromUserAgent(input.userAgent),
    new Date().toISOString(),
  );
}

const EMPTY: AnalyticsSummary = {
  totalViews: 0,
  uniqueViewers: 0,
  averageCompletion: 0,
  totalWatchSeconds: 0,
  devices: [],
  daily: [],
};

export function summarise(scope: { mediaId?: string; userId?: string }): AnalyticsSummary {
  const where = scope.mediaId
    ? { clause: "e.media_id = ?", params: [scope.mediaId] }
    : { clause: "m.user_id = ?", params: [scope.userId] };

  const base = `FROM playback_events e JOIN media m ON m.id = e.media_id WHERE ${where.clause}`;

  const totals = db
    .prepare(
      `SELECT COUNT(*) FILTER (WHERE e.type = 'start') AS starts,
              COUNT(DISTINCT e.viewer_hash) AS viewers,
              COALESCE(SUM(CASE WHEN e.type = 'progress' THEN e.seconds ELSE 0 END), 0) AS watched
       ${base}`,
    )
    .get(...where.params) as { starts: number; viewers: number; watched: number } | undefined;

  if (!totals || totals.starts === 0) return EMPTY;

  const completion = db
    .prepare(`SELECT AVG(best) AS average FROM (
        SELECT MAX(e.percent) AS best ${base} GROUP BY e.viewer_hash
      )`)
    .get(...where.params) as { average: number | null };

  const devices = db
    .prepare(`SELECT e.device AS name, COUNT(*) AS views ${base} AND e.type = 'start' GROUP BY e.device ORDER BY views DESC`)
    .all(...where.params) as Array<{ name: string; views: number }>;

  const daily = db
    .prepare(
      `SELECT substr(e.created_at, 1, 10) AS date, COUNT(*) AS views
       ${base} AND e.type = 'start' GROUP BY date ORDER BY date`,
    )
    .all(...where.params) as Array<{ date: string; views: number }>;

  return {
    totalViews: totals.starts,
    uniqueViewers: totals.viewers,
    averageCompletion: completion.average ?? 0,
    totalWatchSeconds: Math.round(totals.watched),
    devices,
    daily,
  };
}
