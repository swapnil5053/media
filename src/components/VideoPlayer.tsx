import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Loader2, RefreshCcw } from 'lucide-react';
import { getMediaStream } from '@/api/media';

interface VideoPlayerProps {
  mediaId: string;
}

export function VideoPlayer({ mediaId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [streamUrl, setStreamUrl] = React.useState('');

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
    }, () => {
      // Player is ready
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [streamUrl]);

  if (loading) {
    return (
      <div className="w-full aspect-video bg-[#0a0a0a] flex items-center justify-center border border-[var(--border)] rounded-lg overflow-hidden">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-video bg-[#0a0a0a] flex flex-col items-center justify-center border border-[var(--border)] text-red-400 gap-3 rounded-lg overflow-hidden">
        <RefreshCcw className="w-8 h-8 opacity-50" />
        <span className="font-sans text-sm">Playback unavailable</span>
      </div>
    );
  }

  return (
    <div className="w-full relative rounded-lg overflow-hidden border border-[var(--border)]">
      <video ref={videoRef} className="video-js vjs-adaptflow" />
    </div>
  );
}
