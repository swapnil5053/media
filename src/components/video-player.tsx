import { useEffect, useRef } from "react";
import type { CaptionTrack } from "@shared/types";
import { api } from "@/lib/api";

const PROGRESS_INTERVAL_SECONDS = 15;

interface VideoPlayerProps {
  mediaId: string;
  mp4Url: string;
  hlsUrl: string | null;
  posterUrl: string | null;
  title: string;
  captions?: CaptionTrack[];
}

/**
 * Native controls on purpose: they are already accessible, they behave the way
 * each platform expects, and they cost nothing to download.
 */
export function VideoPlayer({ mediaId, mp4Url, hlsUrl, posterUrl, title, captions = [] }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reported = useRef({ started: false, completed: false, lastProgressAt: 0 });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const canPlayHlsNatively = video.canPlayType("application/vnd.apple.mpegurl") !== "";

    if (!hlsUrl) {
      video.src = mp4Url;
      return;
    }

    if (canPlayHlsNatively) {
      video.src = hlsUrl;
      return;
    }

    let destroy = () => {};

    void import("hls.js").then(({ default: Hls }) => {
      if (!Hls.isSupported()) {
        video.src = mp4Url;
        return;
      }

      const hls = new Hls({ enableWorker: true });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          hls.destroy();
          video.src = mp4Url;
        }
      });

      destroy = () => hls.destroy();
    });

    return () => destroy();
  }, [hlsUrl, mp4Url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const send = (type: "start" | "progress" | "complete", seconds: number) => {
      const percent = video.duration > 0 ? video.currentTime / video.duration : 0;
      void api.post("/analytics/events", { mediaId, type, percent, seconds }).catch(() => {
        // Analytics must never interrupt playback.
      });
    };

    const onPlay = () => {
      if (reported.current.started) return;
      reported.current.started = true;
      send("start", 0);
    };

    const onTimeUpdate = () => {
      if (video.currentTime - reported.current.lastProgressAt < PROGRESS_INTERVAL_SECONDS) return;
      reported.current.lastProgressAt = video.currentTime;
      send("progress", PROGRESS_INTERVAL_SECONDS);
    };

    const onEnded = () => {
      if (reported.current.completed) return;
      reported.current.completed = true;
      send("complete", 0);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [mediaId]);

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      preload="metadata"
      poster={posterUrl ?? undefined}
      title={title}
      crossOrigin="anonymous"
      className="aspect-video w-full rounded-card bg-black object-contain"
    >
      {captions.map((caption, index) => (
        <track
          key={caption.id}
          kind="subtitles"
          src={caption.url}
          srcLang={caption.language}
          label={caption.label}
          default={index === 0}
        />
      ))}
    </video>
  );
}
