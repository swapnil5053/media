import { createHash, randomBytes } from "node:crypto";
import { nanoid } from "nanoid";
import type { ApiKey } from "@shared/types.js";
import { db } from "../db/index.js";
import { forbidden, notFound } from "../lib/errors.js";
import type { UserRow } from "./auth-service.js";

const PREFIX = "af_live_";

const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export function listApiKeys(userId: string): ApiKey[] {
  return db
    .prepare(
      `SELECT id, name, prefix, last_used_at AS lastUsedAt, created_at AS createdAt
       FROM api_keys WHERE user_id = ? ORDER BY created_at DESC`,
    )
    .all(userId) as ApiKey[];
}

/**
 * The plaintext token is returned exactly once. Only its SHA-256 digest is
 * stored, so a database dump cannot be used to call the API.
 */
export function createApiKey(userId: string, name: string): ApiKey {
  const token = `${PREFIX}${randomBytes(24).toString("base64url")}`;
  const id = nanoid(12);
  const prefix = token.slice(0, PREFIX.length + 6);
  const createdAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO api_keys (id, user_id, name, prefix, token_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, userId, name, prefix, digest(token), createdAt);

  return { id, name, prefix, lastUsedAt: null, createdAt, token };
}

export function revokeApiKey(userId: string, keyId: string): void {
  const row = db.prepare(`SELECT user_id FROM api_keys WHERE id = ?`).get(keyId) as { user_id: string } | undefined;
  if (!row) throw notFound("That key no longer exists.");
  if (row.user_id !== userId) throw forbidden();

  db.prepare(`DELETE FROM api_keys WHERE id = ?`).run(keyId);
}

export function findUserByToken(token: string): UserRow | null {
  if (!token.startsWith(PREFIX)) return null;

  const row = db
    .prepare(
      `SELECT u.*, k.id AS key_id FROM api_keys k JOIN users u ON u.id = k.user_id WHERE k.token_hash = ?`,
    )
    .get(digest(token)) as (UserRow & { key_id: string }) | undefined;

  if (!row) return null;

  db.prepare(`UPDATE api_keys SET last_used_at = ? WHERE id = ?`).run(new Date().toISOString(), row.key_id);
  return row;
}
