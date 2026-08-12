import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PLANS } from "@shared/types";
import { formatBytes } from "@/lib/format";
import { useAccount } from "@/hooks/use-account";
import { useMediaList } from "@/hooks/use-media";
import { useOverview } from "@/hooks/use-sharing";
import { MediaCard, MediaCardSkeleton } from "@/components/media-card";
import { UploadPanel } from "@/components/upload-panel";
import { Stat } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";

export function Library() {
  const { data: account } = useAccount();
  const media = useMediaList();
  const overview = useOverview();
  const [query, setQuery] = useState("");

  const plan = account ? PLANS[account.plan] : PLANS.free;
  const remaining = account ? Math.max(0, plan.maxVideos - account.usage.videos) : 0;

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term || !media.data) return (media.data ?? []);
    return media.data.filter((item) => item.title.toLowerCase().includes(term));
  }, [media.data, query]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">Your library</h1>
        <p className="mt-1 text-sm text-muted">
          {account ? `${remaining} of ${plan.maxVideos} uploads left on ${plan.name}.` : ""}
        </p>
      </div>

      <UploadPanel storageHint={`up to ${formatBytes(plan.maxUploadBytes)} per file`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Videos" value={account?.usage.videos ?? 0} />
        <Stat label="Storage used" value={formatBytes(account?.usage.storageBytes)} hint={`of ${formatBytes(plan.maxStorageBytes)}`} />
        <Stat
          label="Saved by converting"
          value={formatBytes(account?.usage.bytesSaved)}
          hint={account && account.usage.bytesSaved > 0 ? "smaller than your originals" : "no savings yet"}
        />
        <Stat label="Active links" value={overview.data?.activeLinks ?? 0} />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-[15px] font-semibold text-ink">
            Videos {media.data ? <span className="font-normal text-muted">({media.data.length})</span> : null}
          </h2>

          {media.data && media.data.length > 0 ? (
            <div className="relative w-full max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
              <Input
                className="pl-9"
                placeholder="Search by title"
                value={query}
                aria-label="Search videos"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          ) : null}
        </div>

        {media.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <MediaCardSkeleton key={index} />
            ))}
          </div>
        ) : media.isError ? (
          <ErrorState message="We could not load your library." onRetry={() => void media.refetch()} />
        ) : filtered.length === 0 && query ? (
          <EmptyState
            title={`Nothing matches “${query}”`}
            description="Try a different word, or clear the search to see everything."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No videos yet"
            description="Upload the video that would not open on someone else's phone. We will make it play."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
