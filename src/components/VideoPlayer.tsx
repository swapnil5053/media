import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Loader2, RefreshCcw } from 'lucide-react';
import { getMediaStream } from '@/api/media';

interface VideoPlayerProps {
  mediaId: string;
}

export function VideoPlayer({ mediaId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');

  useEffect(() => {
    let mounted = true;

    getMediaStream(mediaId)
      .then((res) => {
        if (mounted) {
          setStreamUrl(res.stream_url);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, [mediaId]);

  useEffect(() => {
    if (!videoRef.current || !streamUrl) return;

    playerRef.current = videojs(videoRef.current, {
      controls: true,
      fluid: true,
      responsive: true,
      sources: [{
        src: streamUrl,
        type: streamUrl.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'
      }]
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [streamUrl]);

  if (loading) {
    return (
      <div className="w-full aspect-video bg-[var(--bg-base)] flex items-center justify-center rounded-lg overflow-hidden border border-[var(--border)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin" />
          <span className="font-mono text-[11px] text-[var(--text-tertiary)] uppercase tracking-[0.08em]">
            Loading stream...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-video bg-[var(--bg-base)] flex flex-col items-center justify-center border border-[var(--border)] text-[var(--status-failed)] gap-3 rounded-lg overflow-hidden">
        <RefreshCcw className="w-6 h-6 opacity-50" />
        <span className="font-sans text-[13px]">Playback unavailable</span>
      </div>
    );
  }

  return (
    <div className="w-full relative rounded-lg overflow-hidden border border-[var(--border)]">
      <video ref={videoRef} className="video-js vjs-adaptflow" />
    </div>
  );
}
