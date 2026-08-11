import { Router } from "express";
import { z } from "zod";
import { param } from "../lib/params.js";
import { requireSession } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { createApiKey, listApiKeys, revokeApiKey } from "../services/api-key-service.js";
import { createWebhook, deleteWebhook, listWebhooks } from "../services/webhook-service.js";

export const developerRouter = Router();
developerRouter.use(requireSession);

developerRouter.get("/keys", (req, res) => {
  res.json(listApiKeys(req.user!.id));
});

developerRouter.post("/keys", validateBody(z.object({ name: z.string().min(1).max(60) })), (req, res) => {
  res.status(201).json(createApiKey(req.user!.id, (req.body as { name: string }).name.trim()));
});

developerRouter.delete("/keys/:id", (req, res) => {
  revokeApiKey(req.user!.id, param(req, "id"));
  res.status(204).end();
});

developerRouter.get("/webhooks", (req, res) => {
  res.json(listWebhooks(req.user!.id));
});

developerRouter.post(
  "/webhooks",
  validateBody(z.object({ url: z.url("Enter a full https:// URL.") })),
  (req, res) => {
    res.status(201).json(createWebhook(req.user!.id, (req.body as { url: string }).url));
  },
);

developerRouter.delete("/webhooks/:id", (req, res) => {
  deleteWebhook(req.user!.id, param(req, "id"));
  res.status(204).end();
});
