import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatBytes, formatDuration, formatPercent, formatResolution } from "@/lib/format";
import { useDeleteMedia, useMedia, useRenameMedia } from "@/hooks/use-media";
import { useMediaAnalytics } from "@/hooks/use-sharing";
import { CompatibilityReport } from "@/components/compatibility-report";
import { SharePanel } from "@/components/share-panel";
import { StatusBadge } from "@/components/media-card";
import { VideoPlayer } from "@/components/video-player";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ErrorState, Progress, Skeleton } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 py-2.5">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="font-mono text-[13px] text-ink">{value}</dd>
    </div>
  );
}

export function MediaDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const media = useMedia(id);
  const analytics = useMediaAnalytics(id);
  const rename = useRenameMedia(id);
  const remove = useDeleteMedia();
  const [title, setTitle] = useState<string | null>(null);

  if (media.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="aspect-video w-full" />
      </div>
    );
  }

  if (media.isError || !media.data) {
    return <ErrorState message="We could not open that video." onRetry={() => void media.refetch()} />;
  }

  const item = media.data;
  const processing = item.status !== "ready" && item.status !== "failed";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/library" className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft size={15} aria-hidden />
          Library
        </Link>
        <StatusBadge status={item.status} />

        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-critical hover:bg-critical-soft"
          onClick={() => {
            if (!confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
            remove.mutate(item.id, {
              onSuccess: () => {
                toast.success("Video deleted");
                navigate("/library");
              },
            });
          }}
        >
          <Trash2 size={15} aria-hidden />
          Delete
        </Button>
      </div>

      <Input
        aria-label="Video title"
        className="h-auto border-transparent bg-transparent px-0 text-2xl font-semibold focus:border-transparent focus:ring-0"
        value={title ?? item.title}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={() => {
          if (title === null || title.trim() === item.title || !title.trim()) return setTitle(null);
          rename.mutate(title.trim(), { onSuccess: () => setTitle(null) });
        }}
      />

      {item.status === "failed" ? (
        <ErrorState message={item.error ?? "This video could not be processed."} />
      ) : processing ? (
        <Card className="px-5 py-6">
          <p className="text-sm font-medium text-ink">Getting this ready to play everywhere</p>
          <p className="mt-1 text-[13px] text-muted">
            We are checking the file and converting it if any device would struggle with it.
          </p>
          <div className="mt-4">
            <Progress value={item.progress} label="Processing" />
          </div>
        </Card>
      ) : (
        <VideoPlayer
          mediaId={item.id}
          title={item.title}
          mp4Url={`/api/stream/${item.id}/video.mp4`}
          hlsUrl={item.hasHls ? `/api/stream/${item.id}/hls/master.m3u8` : null}
          posterUrl={item.posterUrl}
        />
      )}

      {item.compatibility ? (
        <CompatibilityReport report={item.compatibility} wasConverted={item.wasConverted} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {item.source ? (
          <Card>
            <CardHeader title="File details" />
            <dl className="divide-y divide-line">
              <SpecRow label="Original file" value={item.originalFilename} />
              <SpecRow label="Resolution" value={formatResolution(item.source.width, item.source.height)} />
              <SpecRow label="Duration" value={formatDuration(item.source.durationSeconds)} />
              <SpecRow label="Frame rate" value={`${item.source.fps} fps`} />
              <SpecRow label="Uploaded size" value={formatBytes(item.sizeBytes)} />
              <SpecRow label="Delivered size" value={formatBytes(item.deliverySizeBytes ?? item.sizeBytes)} />
              <SpecRow label="Streaming" value={item.hasHls ? "Adaptive (HLS) + MP4" : "MP4"} />
            </dl>
          </Card>
        ) : null}

        <Card>
          <CardHeader title="Playback" description="Counted from real plays of this video." />
          {analytics.isPending ? (
            <div className="px-5 py-4">
              <Skeleton className="h-16 w-full" />
            </div>
          ) : analytics.data && analytics.data.totalViews > 0 ? (
            <dl className="divide-y divide-line">
              <SpecRow label="Views" value={String(analytics.data.totalViews)} />
              <SpecRow label="Unique viewers" value={String(analytics.data.uniqueViewers)} />
              <SpecRow label="Average completion" value={formatPercent(analytics.data.averageCompletion)} />
              <SpecRow label="Watch time" value={formatDuration(analytics.data.totalWatchSeconds)} />
              <SpecRow
                label="Most common device"
                value={analytics.data.devices[0]?.name ?? "Unknown"}
              />
            </dl>
          ) : (
            <p className="px-5 py-8 text-center text-[13px] text-muted">
              No plays yet. Share the link below and this fills in.
            </p>
          )}
        </Card>
      </div>

      {item.status === "ready" ? <SharePanel mediaId={item.id} /> : null}
    </div>
  );
}
