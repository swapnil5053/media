import { useState } from "react";
import { Copy, Link2Off } from "lucide-react";
import { toast } from "sonner";
import type { ShareLink } from "@shared/types";
import { formatDate } from "@/lib/format";
import { useCreateShareLink, useRevokeShareLink, useShareLinks } from "@/hooks/use-sharing";
import { ApiError } from "@/lib/api";
import { Button } from "./ui/button";
import { Card, CardHeader } from "./ui/card";
import { Checkbox, Field, Input, Select } from "./ui/input";
import { Badge, Skeleton } from "./ui/feedback";

const EXPIRY_OPTIONS = [
  { value: "", label: "Never expires" },
  { value: "24", label: "24 hours" },
  { value: "168", label: "7 days" },
  { value: "720", label: "30 days" },
];

const STATUS_TONES = {
  active: "positive",
  revoked: "neutral",
  expired: "neutral",
  exhausted: "caution",
} as const;

function LinkRow({ link, onRevoke }: { link: ShareLink; onRevoke: (slug: string) => void }) {
  async function copy() {
    await navigator.clipboard.writeText(link.url);
    toast.success("Link copied");
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[13px] text-ink">{link.url}</p>
        <p className="mt-0.5 text-[13px] text-muted">
          {link.views} {link.views === 1 ? "view" : "views"}
          {link.maxViews ? ` of ${link.maxViews}` : ""}
          {link.hasPassword ? " · password" : ""}
          {link.expiresAt ? ` · until ${formatDate(link.expiresAt)}` : ""}
        </p>
      </div>

      <Badge tone={STATUS_TONES[link.status]}>{link.status}</Badge>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={copy} aria-label="Copy link">
          <Copy size={15} aria-hidden />
        </Button>
        {link.status === "active" ? (
          <Button variant="ghost" size="sm" onClick={() => onRevoke(link.slug)} aria-label="Turn off link">
            <Link2Off size={15} aria-hidden />
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function SharePanel({ mediaId }: { mediaId: string }) {
  const links = useShareLinks(mediaId);
  const createLink = useCreateShareLink(mediaId);
  const revokeLink = useRevokeShareLink(mediaId);

  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresIn, setExpiresIn] = useState("");
  const [maxViews, setMaxViews] = useState("");

  function create() {
    createLink.mutate(
      {
        mediaId,
        password: usePassword && password ? password : undefined,
        expiresInHours: expiresIn ? Number(expiresIn) : undefined,
        maxViews: maxViews ? Number(maxViews) : undefined,
      },
      {
        onSuccess: async (link) => {
          await navigator.clipboard.writeText(link.url).catch(() => undefined);
          toast.success("Share link created", { description: "Copied to your clipboard." });
          setPassword("");
          setMaxViews("");
          setUsePassword(false);
        },
        onError: (error) =>
          toast.error("Could not create link", {
            description: error instanceof ApiError ? error.message : "Please try again.",
          }),
      },
    );
  }

  return (
    <Card>
      <CardHeader title="Share" description="Anyone with the link gets the version that plays on their device." />

      <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
        <Field label="Link expires">
          {(id) => (
            <Select id={id} value={expiresIn} onChange={(event) => setExpiresIn(event.target.value)}>
              {EXPIRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="View limit" hint="Leave empty for unlimited views.">
          {(id) => (
            <Input
              id={id}
              type="number"
              min={1}
              placeholder="Unlimited"
              value={maxViews}
              onChange={(event) => setMaxViews(event.target.value)}
            />
          )}
        </Field>

        <div className="sm:col-span-2">
          <Checkbox
            label="Require a password"
            checked={usePassword}
            onChange={(event) => setUsePassword(event.target.checked)}
          />
          {usePassword ? (
            <Input
              className="mt-2.5"
              type="password"
              placeholder="At least 4 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <Button onClick={create} disabled={createLink.isPending || (usePassword && password.length < 4)}>
            {createLink.isPending ? "Creating…" : "Create share link"}
          </Button>
        </div>
      </div>

      <div className="border-t border-line">
        {links.isPending ? (
          <div className="px-5 py-4">
            <Skeleton className="h-10 w-full" />
          </div>
        ) : links.data && links.data.length > 0 ? (
          <ul className="divide-y divide-line">
            {links.data.map((link) => (
              <LinkRow key={link.id} link={link} onRevoke={(slug) => revokeLink.mutate(slug)} />
            ))}
          </ul>
        ) : (
          <p className="px-5 py-6 text-center text-[13px] text-muted">No links yet.</p>
        )}
      </div>
    </Card>
  );
}
