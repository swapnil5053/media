import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { nanoid } from "nanoid";
import type { Webhook } from "@shared/types.js";
import { db } from "../db/index.js";
import { forbidden, notFound } from "../lib/errors.js";
import { enqueue } from "../jobs/queue.js";

export type WebhookEvent = "video.ready" | "video.failed";

interface WebhookRow {
  id: string;
  user_id: string;
  url: string;
  secret: string;
  active: number;
  created_at: string;
}

export interface WebhookJobPayload {
  webhookId: string;
  deliveryId: string;
  event: WebhookEvent;
  body: string;
}

export function listWebhooks(userId: string): Webhook[] {
  const rows = db.prepare(`SELECT * FROM webhooks WHERE user_id = ? ORDER BY created_at`).all(userId) as WebhookRow[];

  return rows.map((row) => ({
    id: row.id,
    url: row.url,
    secret: row.secret,
    active: row.active === 1,
    createdAt: row.created_at,
    deliveries: (
      db
        .prepare(
          `SELECT id, event, status_code AS statusCode, ok, attempts, error, created_at AS createdAt
           FROM webhook_deliveries WHERE webhook_id = ? ORDER BY created_at DESC LIMIT 10`,
        )
        .all(row.id) as Array<Omit<Webhook["deliveries"][number], "ok"> & { ok: number }>
    ).map((delivery) => ({ ...delivery, ok: delivery.ok === 1 })),
  }));
}

export function createWebhook(userId: string, url: string): Webhook {
  const id = nanoid(12);
  db.prepare(`INSERT INTO webhooks (id, user_id, url, secret, active, created_at) VALUES (?, ?, ?, ?, 1, ?)`).run(
    id,
    userId,
    url,
    `whsec_${randomBytes(24).toString("base64url")}`,
    new Date().toISOString(),
  );

  return listWebhooks(userId).find((webhook) => webhook.id === id)!;
}

export function deleteWebhook(userId: string, webhookId: string): void {
  const row = db.prepare(`SELECT user_id FROM webhooks WHERE id = ?`).get(webhookId) as
    | { user_id: string }
    | undefined;

  if (!row) throw notFound("That webhook no longer exists.");
  if (row.user_id !== userId) throw forbidden();

  db.prepare(`DELETE FROM webhooks WHERE id = ?`).run(webhookId);
}

/**
 * Signs the body the way Stripe and GitHub do: a timestamped HMAC the receiver
 * recomputes, which makes the payload tamper-evident and replay-resistant.
 */
export function signPayload(secret: string, timestamp: number, body: string): string {
  return `t=${timestamp},v1=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
}

export function verifySignature(secret: string, header: string, body: string, toleranceSeconds = 300): boolean {
  const parts = Object.fromEntries(header.split(",").map((part) => part.split("=") as [string, string]));
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  const received = parts.v1 ?? "";
  if (expected.length !== received.length) return false;

  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

/** Queues one delivery per active endpoint; retries are the job runner's problem. */
export function dispatchEvent(userId: string, event: WebhookEvent, data: Record<string, unknown>): void {
  const hooks = db
    .prepare(`SELECT * FROM webhooks WHERE user_id = ? AND active = 1`)
    .all(userId) as WebhookRow[];

  for (const hook of hooks) {
    const deliveryId = nanoid(12);
    const body = JSON.stringify({ id: deliveryId, event, createdAt: new Date().toISOString(), data });

    db.prepare(
      `INSERT INTO webhook_deliveries (id, webhook_id, event, ok, attempts, created_at) VALUES (?, ?, ?, 0, 0, ?)`,
    ).run(deliveryId, hook.id, event, new Date().toISOString());

    enqueue({
      type: "deliver-webhook",
      payload: { webhookId: hook.id, deliveryId, event, body } satisfies WebhookJobPayload,
      userId,
      priority: 50,
      maxAttempts: 5,
    });
  }
}

export function findWebhook(webhookId: string): WebhookRow | null {
  return (db.prepare(`SELECT * FROM webhooks WHERE id = ?`).get(webhookId) as WebhookRow | undefined) ?? null;
}

export function recordDelivery(deliveryId: string, result: { statusCode?: number; ok: boolean; error?: string }): void {
  db.prepare(
    `UPDATE webhook_deliveries SET status_code = ?, ok = ?, attempts = attempts + 1, error = ? WHERE id = ?`,
  ).run(result.statusCode ?? null, result.ok ? 1 : 0, result.error ?? null, deliveryId);
}
