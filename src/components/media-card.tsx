import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Film, ShieldCheck } from "lucide-react";
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

const SPRITE_COLUMNS = 5;
const SPRITE_ROWS = 5;
const FRAME_MS = 180;

export function StatusBadge({ status }: { status: MediaStatus }) {
  if (status === "ready") return <Badge tone="positive">Ready</Badge>;
  if (status === "failed") return <Badge tone="critical">Failed</Badge>;
  return <Badge tone="caution">{STATUS_LABELS[status]}</Badge>;
}

/**
 * Steps through the storyboard sprite while the pointer is over the card, which
 * gives a moving preview without downloading any video.
 */
function StoryboardPreview({ spriteUrl, active }: { spriteUrl: string; active: boolean }) {
  const [frame, setFrame] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!active) {
      setFrame(0);
      return;
    }

    timer.current = window.setInterval(() => {
      setFrame((current) => (current + 1) % (SPRITE_COLUMNS * SPRITE_ROWS));
    }, FRAME_MS);

    return () => window.clearInterval(timer.current);
  }, [active]);

  const column = frame % SPRITE_COLUMNS;
  const row = Math.floor(frame / SPRITE_COLUMNS);

  return (
    <div
      aria-hidden
      className="absolute inset-0 transition-opacity duration-150"
      style={{
        opacity: active ? 1 : 0,
        backgroundImage: `url(${spriteUrl})`,
        backgroundSize: `${SPRITE_COLUMNS * 100}% ${SPRITE_ROWS * 100}%`,
        backgroundPosition: `${(column / (SPRITE_COLUMNS - 1)) * 100}% ${(row / (SPRITE_ROWS - 1)) * 100}%`,
      }}
    />
  );
}

export function MediaCard({ media }: { media: Media }) {
  const [hovering, setHovering] = useState(false);
  const processing = media.status !== "ready" && media.status !== "failed";

  return (
    <Link
      to={`/library/${media.id}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      className="group rounded-card border border-line bg-panel transition-colors duration-150 hover:border-line-strong"
    >
      <div className="relative aspect-video overflow-hidden rounded-t-[calc(var(--radius-card)-1px)] bg-raised">
        {media.posterUrl ? (
          <img src={media.posterUrl} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-subtle">
            <Film size={22} aria-hidden />
          </div>
        )}

        {media.spriteUrl ? <StoryboardPreview spriteUrl={media.spriteUrl} active={hovering} /> : null}

        {media.duplicateOf ? (
          <span className="absolute left-2 top-2 rounded bg-caution/10 px-1.5 py-0.5 text-[12px] font-medium text-caution">
            <Copy size={11} className="mr-1 inline" aria-hidden />
            Duplicate
          </span>
        ) : null}

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
            <p className="mt-1.5 text-[13px] text-muted">
              {STATUS_LABELS[media.status]} · {Math.round(media.progress * 100)}%
            </p>
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
    <div className="rounded-card border border-line bg-panel">
      <div className="aspect-video animate-pulse rounded-t-[calc(var(--radius-card)-1px)] bg-raised" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/5 animate-pulse rounded bg-raised" />
        <div className="h-3 w-2/5 animate-pulse rounded bg-raised" />
      </div>
    </div>
  );
}
