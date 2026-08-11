import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { WatchPayload } from "@shared/types";
import { ApiError, api } from "@/lib/api";
import { VideoPlayer } from "@/components/video-player";

/**
 * The iframe target. No navigation, no chrome — just the player, so it can be
 * dropped into a blog post or a Notion page.
 */
export function Embed() {
  const { slug = "" } = useParams();
  const [video, setVideo] = useState<WatchPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .post<WatchPayload>(`/shares/${slug}/open`, {})
      .then(setVideo)
      .catch((cause: unknown) =>
        setError(cause instanceof ApiError ? cause.message : "This video could not be loaded."),
      );
  }, [slug]);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black px-6 text-center">
        <p className="text-sm text-white/70">{error}</p>
      </div>
    );
  }

  if (!video) return <div className="min-h-dvh bg-black" />;

  return (
    <div className="min-h-dvh bg-black">
      <VideoPlayer
        mediaId={video.mediaId}
        title={video.title}
        mp4Url={video.mp4Url}
        hlsUrl={video.hlsUrl}
        posterUrl={video.posterUrl}
        captions={video.captions}
      />
    </div>
  );
}
