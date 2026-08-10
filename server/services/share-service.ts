import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import type { ShareLink } from "@shared/types.js";
import { config } from "../config.js";
import { db } from "../db/index.js";
import { forbidden, notFound, unauthorized } from "../lib/errors.js";

const slugId = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 10);

interface ShareRow {
  id: string;
  slug: string;
  media_id: string;
  user_id: string;
  password_hash: string | null;
  expires_at: string | null;
  max_views: number | null;
  views: number;
  revoked: number;
  created_at: string;
}

function statusOf(row: ShareRow): ShareLink["status"] {
  if (row.revoked === 1) return "revoked";
  if (row.expires_at && new Date(row.expires_at) <= new Date()) return "expired";
  if (row.max_views !== null && row.views >= row.max_views) return "exhausted";
  return "active";
}

function toShareLink(row: ShareRow): ShareLink {
  return {
    id: row.id,
    slug: row.slug,
    url: `${config.appUrl}/w/${row.slug}`,
    mediaId: row.media_id,
    hasPassword: row.password_hash !== null,
    expiresAt: row.expires_at,
    maxViews: row.max_views,
    views: row.views,
    status: statusOf(row),
    createdAt: row.created_at,
  };
}

export async function createShareLink(input: {
  mediaId: string;
  userId: string;
  password?: string;
  expiresInHours?: number;
  maxViews?: number;
}): Promise<ShareLink> {
  const row: ShareRow = {
    id: slugId(),
    slug: slugId(),
    media_id: input.mediaId,
    user_id: input.userId,
    password_hash: input.password ? await bcrypt.hash(input.password, 10) : null,
    expires_at: input.expiresInHours
      ? new Date(Date.now() + input.expiresInHours * 3_600_000).toISOString()
      : null,
    max_views: input.maxViews ?? null,
    views: 0,
    revoked: 0,
    created_at: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO share_links (id, slug, media_id, user_id, password_hash, expires_at, max_views, views, revoked, created_at)
     VALUES (@id, @slug, @media_id, @user_id, @password_hash, @expires_at, @max_views, 0, 0, @created_at)`,
  ).run(row);

  return toShareLink(row);
}

export function listShareLinks(mediaId: string): ShareLink[] {
  const rows = db
    .prepare(`SELECT * FROM share_links WHERE media_id = ? ORDER BY created_at DESC`)
    .all(mediaId) as ShareRow[];
  return rows.map(toShareLink);
}

export function countActiveLinks(userId: string): number {
  const rows = db.prepare(`SELECT * FROM share_links WHERE user_id = ?`).all(userId) as ShareRow[];
  return rows.filter((row) => statusOf(row) === "active").length;
}

export function revokeShareLink(slug: string, userId: string): void {
  const row = db.prepare(`SELECT * FROM share_links WHERE slug = ?`).get(slug) as ShareRow | undefined;
  if (!row) throw notFound("That link no longer exists.");
  if (row.user_id !== userId) throw forbidden();

  db.prepare(`UPDATE share_links SET revoked = 1 WHERE slug = ?`).run(slug);
}

/**
 * Resolves a public link. Expiry, view limits and passwords are all enforced
 * here rather than in the UI, so knowing the URL is never enough on its own.
 */
export async function openShareLink(slug: string, password: string | undefined) {
  const row = db.prepare(`SELECT * FROM share_links WHERE slug = ?`).get(slug) as ShareRow | undefined;
  if (!row) throw notFound("This link does not exist.");

  const status = statusOf(row);
  if (status === "revoked") throw notFound("This link has been turned off by its owner.");
  if (status === "expired") throw notFound("This link has expired.");
  if (status === "exhausted") throw notFound("This link has reached its view limit.");

  if (row.password_hash) {
    if (!password) throw unauthorized("This video is password protected.");
    const matches = await bcrypt.compare(password, row.password_hash);
    if (!matches) throw unauthorized("That password is not correct.");
  }

  db.prepare(`UPDATE share_links SET views = views + 1 WHERE id = ?`).run(row.id);

  return { shareId: row.id, mediaId: row.media_id };
}
