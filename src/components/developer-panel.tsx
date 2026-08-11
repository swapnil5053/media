import { useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import {
  useApiKeys,
  useCreateApiKey,
  useCreateWebhook,
  useDeleteWebhook,
  useRevokeApiKey,
  useWebhooks,
} from "@/hooks/use-developer";
import { Button } from "./ui/button";
import { Card, CardHeader } from "./ui/card";
import { Badge } from "./ui/feedback";
import { Input } from "./ui/input";

function CurlExample({ token }: { token: string }) {
  const snippet = `curl -X POST ${window.location.origin}/api/media \\
  -H "Authorization: Bearer ${token}" \\
  -F "file=@holiday.mov"`;

  return (
    <pre className="mt-3 overflow-x-auto rounded-lg bg-sunken p-3 font-mono text-[12.5px] leading-relaxed text-ink">
      {snippet}
    </pre>
  );
}

export function DeveloperPanel() {
  const apiKeys = useApiKeys();
  const webhooks = useWebhooks();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();

  const [keyName, setKeyName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [freshToken, setFreshToken] = useState<string | null>(null);

  return (
    <>
      <Card>
        <CardHeader
          title="API keys"
          description="Upload straight from a script or CI. Keys are stored hashed, so this is the only time you see one."
        />

        {apiKeys.data && apiKeys.data.length > 0 ? (
          <ul className="divide-y divide-line border-b border-line">
            {apiKeys.data.map((key) => (
              <li key={key.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className="text-sm text-ink">{key.name}</span>
                <span className="font-mono text-[13px] text-muted">{key.prefix}…</span>
                <span className="text-[13px] text-subtle">
                  {key.lastUsedAt ? `used ${formatRelative(key.lastUsedAt)}` : "never used"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  aria-label={`Revoke ${key.name}`}
                  onClick={() => revokeKey.mutate(key.id)}
                >
                  <Trash2 size={15} aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="px-5 py-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <label className="field-label" htmlFor="key-name">
                Key name
              </label>
              <Input
                id="key-name"
                placeholder="CI uploader"
                value={keyName}
                onChange={(event) => setKeyName(event.target.value)}
              />
            </div>
            <Button
              disabled={!keyName.trim() || createKey.isPending}
              onClick={() =>
                createKey.mutate(keyName.trim(), {
                  onSuccess: (key) => {
                    setFreshToken(key.token ?? null);
                    setKeyName("");
                  },
                })
              }
            >
              Create key
            </Button>
          </div>

          {freshToken ? (
            <div className="mt-4 rounded-lg border border-accent/25 bg-accent-soft p-4">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium text-ink">Copy this now — it will not be shown again.</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={async () => {
                    await navigator.clipboard.writeText(freshToken);
                    toast.success("API key copied");
                  }}
                >
                  <Copy size={15} aria-hidden />
                </Button>
              </div>
              <p className="mt-2 break-all font-mono text-[12.5px] text-ink">{freshToken}</p>
              <CurlExample token={freshToken} />
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Webhooks"
          description="We POST video.ready and video.failed with an HMAC-SHA256 signature, retrying with backoff up to five times."
        />

        {webhooks.data && webhooks.data.length > 0 ? (
          <ul className="divide-y divide-line border-b border-line">
            {webhooks.data.map((webhook) => (
              <li key={webhook.id} className="px-5 py-3.5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-0 truncate font-mono text-[13px] text-ink">{webhook.url}</span>
                  <Badge tone={webhook.active ? "positive" : "neutral"}>{webhook.active ? "active" : "paused"}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    aria-label="Delete webhook"
                    onClick={() => deleteWebhook.mutate(webhook.id)}
                  >
                    <Trash2 size={15} aria-hidden />
                  </Button>
                </div>

                <p className="mt-1 font-mono text-[12.5px] text-subtle">{webhook.secret}</p>

                {webhook.deliveries.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {webhook.deliveries.slice(0, 3).map((delivery) => (
                      <li key={delivery.id} className="flex items-center gap-2 text-[13px]">
                        <span className={delivery.ok ? "text-positive" : "text-critical"}>
                          {delivery.ok ? "delivered" : "failed"}
                        </span>
                        <span className="text-muted">{delivery.event}</span>
                        <span className="font-mono text-subtle">
                          {delivery.statusCode ?? "—"} · {delivery.attempts} attempt
                          {delivery.attempts === 1 ? "" : "s"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap items-end gap-3 px-5 py-4">
          <div className="min-w-48 flex-1">
            <label className="field-label" htmlFor="webhook-url">
              Endpoint URL
            </label>
            <Input
              id="webhook-url"
              placeholder="https://example.com/hooks/adaptflow"
              value={webhookUrl}
              onChange={(event) => setWebhookUrl(event.target.value)}
            />
          </div>
          <Button
            disabled={!webhookUrl.trim() || createWebhook.isPending}
            onClick={() =>
              createWebhook.mutate(webhookUrl.trim(), {
                onSuccess: () => {
                  setWebhookUrl("");
                  toast.success("Webhook added");
                },
                onError: (error) =>
                  toast.error("Could not add webhook", {
                    description: error instanceof ApiError ? error.message : "Please try again.",
                  }),
              })
            }
          >
            Add endpoint
          </Button>
        </div>
      </Card>
    </>
  );
}
