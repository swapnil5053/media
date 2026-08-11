import { announceFailure, processMedia, type ProcessMediaPayload } from "./handlers/process-media.js";
import { deliverWebhook } from "./handlers/deliver-webhook.js";
import type { WebhookJobPayload } from "../services/webhook-service.js";
import { registerHandler } from "./runner.js";

export function registerJobHandlers(): void {
  registerHandler<ProcessMediaPayload>("process-media", async (context) => {
    try {
      await processMedia(context);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isFinalAttempt = context.job.attempts >= context.job.max_attempts;

      // Only tell the user once the queue has stopped retrying on their behalf.
      if (isFinalAttempt && !context.signal.aborted) {
        announceFailure(context.payload.mediaId, context.payload.userId, message);
      }
      throw error;
    }
  });

  registerHandler<WebhookJobPayload>("deliver-webhook", deliverWebhook);
}
