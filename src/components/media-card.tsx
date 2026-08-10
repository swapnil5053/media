import { Link } from "react-router-dom";
import { Film, ShieldCheck } from "lucide-react";
import type { Media, MediaStatus } from "@shared/types";
import { formatBytes, formatDuration, formatRelative } from "@/lib/format";
import { Badge, Progress } from "./ui/feedback";

const STATUS_LABELS: Record<MediaStatus, string> = {
  queued: "Waiting",
  probing: "Reading file",
  transcoding: "Converting",
  ready: "Ready",
  failed: "Failed",
};

export function StatusBadge({ status }: { status: MediaStatus }) {
  if (status === "ready") return <Badge tone="positive">Ready</Badge>;
  if (status === "failed") return <Badge tone="critical">Failed</Badge>;
  return <Badge tone="caution">{STATUS_LABELS[status]}</Badge>;
}

export function MediaCard({ media }: { media: Media }) {
  const processing = media.status !== "ready" && media.status !== "failed";

  return (
    <Link
      to={`/library/${media.id}`}
      className="group rounded-card border border-line bg-surface transition-colors duration-150 hover:border-line-strong"
    >
      <div className="relative aspect-video overflow-hidden rounded-t-[calc(var(--radius-card)-1px)] bg-sunken">
        {media.posterUrl ? (
          <img
            src={media.posterUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-opacity duration-150 group-hover:opacity-95"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-subtle">
            <Film size={22} aria-hidden />
          </div>
        )}

        {media.source && media.status === "ready" ? (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[12px] text-white">
            {formatDuration(media.source.durationSeconds)}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 truncate text-sm font-medium text-ink">{media.title}</h3>
          <StatusBadge status={media.status} />
        </div>

        {processing ? (
          <div className="mt-3">
            <Progress value={media.progress} label={`Processing ${media.title}`} />
            <p className="mt-1.5 text-[13px] text-muted">{STATUS_LABELS[media.status]} · {Math.round(media.progress * 100)}%</p>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
            <span>{formatBytes(media.deliverySizeBytes ?? media.sizeBytes)}</span>
            <span aria-hidden>·</span>
            <span>{formatRelative(media.createdAt)}</span>
            {media.wasConverted ? (
              <span className="flex items-center gap-1 text-positive">
                <ShieldCheck size={13} aria-hidden />
                Converted
              </span>
            ) : null}
          </div>
        )}
      </div>
    </Link>
  );
}

export function MediaCardSkeleton() {
  return (
    <div className="rounded-card border border-line bg-surface">
      <div className="aspect-video animate-pulse rounded-t-[calc(var(--radius-card)-1px)] bg-sunken" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/5 animate-pulse rounded bg-sunken" />
        <div className="h-3 w-2/5 animate-pulse rounded bg-sunken" />
      </div>
    </div>
  );
}
