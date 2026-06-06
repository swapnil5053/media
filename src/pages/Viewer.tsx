import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getDelivery } from '@/api/delivery';
import { reportPlayback } from '@/api/analytics';
import { API_BASE } from '@/api/client';
import { Lock, Clock, EyeOff, AlertTriangle, Loader2 } from 'lucide-react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

export default function Viewer() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [password, setPassword] = useState('');
  const [data, setData] = useState<{ stream_url: string; media_id: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const sessionActive = useRef(false);

  const fetchContent = async (overridePwd?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDelivery(slug!, overridePwd || undefined);
      setData(res);
      sessionActive.current = true;
    } catch (err: unknown) {
      const apiErr = err as { status?: number };
      if (apiErr.status === 401) {
        setError({ status: 401, message: 'Password required' });
      } else if (apiErr.status === 410) {
        setError({ status: 410, message: 'This link has expired.' });
      } else if (apiErr.status === 429) {
        setError({ status: 429, message: 'This link has reached its view limit.' });
      } else {
        setError({ status: 404, message: "This link doesn't exist or has been removed." });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();

    return () => {
      if (sessionActive.current && data && playerRef.current) {
        const time = playerRef.current.currentTime();
        const dur = playerRef.current.duration();
        const completion = dur > 0 ? time / dur : 0;
        navigator.sendBeacon(
          `${API_BASE}/media/${data.media_id}/playback-event`,
          JSON.stringify({ slug, duration: time, completion })
        );
      }
    };
  }, [slug]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContent(password);
  };

  // Setup Player
  useEffect(() => {
    if (!data || !videoRef.current) return;

    playerRef.current = videojs(videoRef.current, {
      controls: true,
      fill: true,
      sources: [{
        src: data.stream_url,
        type: data.stream_url.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'
      }]
    });

    playerRef.current.on('ended', () => {
      if (data) {
        reportPlayback(data.media_id, slug!, playerRef.current!.duration(), 1.0).catch(console.error);
      }
    });

    return () => {
      if (playerRef.current) playerRef.current.dispose();
    };
  }, [data]);

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-[var(--text-primary)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" />
          <span className="font-mono text-[12px] text-[var(--text-tertiary)] uppercase tracking-[0.08em]">
            Connecting to node...
          </span>
        </div>
      </div>
    );
  }

  // ─── Error States ───
  if (error) {
    if (error.status === 401) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center text-[var(--text-primary)] px-4">
          <form onSubmit={handlePasswordSubmit} className="w-80 bg-[#111] border border-[#222] rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <p className="font-sans text-[14px] font-medium mb-1">This content is protected</p>
            <p className="font-sans text-[12px] text-[var(--text-tertiary)] mb-6">Enter the password to access the stream.</p>
            <input
              type="password"
              autoFocus
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded px-4 py-2.5 mb-4 text-center font-mono placeholder:font-sans focus:border-[var(--accent)] outline-none transition-colors"
              placeholder="Enter password"
            />
            <button
              type="submit"
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-black font-semibold rounded py-2.5 transition-colors cursor-pointer font-mono text-[12px] uppercase tracking-[0.06em]"
            >
              Access Content
            </button>
          </form>
        </div>
      );
    }

    const IconBase = error.status === 410 ? Clock : error.status === 429 ? EyeOff : AlertTriangle;

    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-[var(--text-primary)] px-4">
        <div className="w-80 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center mx-auto mb-5">
            <IconBase className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <p className="font-sans text-[14px] font-medium mb-2">{error.message}</p>
          <p className="font-sans text-[12px] text-[var(--text-tertiary)]">Contact the link creator for access.</p>
        </div>
      </div>
    );
  }

  // ─── Success: Video Player ───
  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center py-12 px-4">
      {/* Tiny amber dot in top-left corner */}
      <div className="fixed top-4 left-4">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] inline-block" />
      </div>

      <div className="w-full max-w-5xl">
        <div className="rounded-xl overflow-hidden border border-[#222] shadow-2xl relative aspect-video max-h-[70vh] bg-black">
          <video ref={videoRef} className="video-js vjs-adaptflow w-full h-full" />
        </div>

        {/* Below video */}
        <div className="mt-3 flex items-center gap-3">
          <span className="font-sans text-[15px] font-medium text-[var(--text-primary)]">{slug}</span>
          <span className="inline-flex items-center gap-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-ready)]" />
            <span className="font-mono text-[10px] text-[var(--text-secondary)]">Ready</span>
          </span>
        </div>
      </div>
    </div>
  );
}
