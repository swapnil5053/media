import { findWebhook, recordDelivery, signPayload, type WebhookJobPayload } from "../../services/webhook-service.js";
import type { JobContext } from "../runner.js";

const TIMEOUT_MS = 10_000;

export async function deliverWebhook({ payload, signal }: JobContext<WebhookJobPayload>): Promise<void> {
  const webhook = findWebhook(payload.webhookId);
  if (!webhook || webhook.active !== 1) return;

  const timestamp = Math.floor(Date.now() / 1000);
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  let statusCode: number | undefined;

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "AdaptFlow-Webhooks/1.0",
        "X-AdaptFlow-Event": payload.event,
        "X-AdaptFlow-Signature": signPayload(webhook.secret, timestamp, payload.body),
      },
      body: payload.body,
      signal: AbortSignal.any([signal, timeout]),
    });

    statusCode = response.status;

    // Non-2xx has to throw, otherwise the runner would treat it as delivered.
    if (!response.ok) throw new Error(`Endpoint answered ${response.status}`);

    recordDelivery(payload.deliveryId, { statusCode, ok: true });
  } catch (error) {
    // Exactly one record per attempt, so the counter matches what the queue did.
    recordDelivery(payload.deliveryId, {
      statusCode,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
