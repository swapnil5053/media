import React, { useEffect, useRef, useState, useCallback } from 'react';
import { formatBytes, formatCompactDuration } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getMediaStream, type MediaItem } from '@/api/media';
import { Film, AlertTriangle, Clock, Play } from 'lucide-react';

interface MediaCardProps {
  item: MediaItem;
  onClick: () => void;
}

export function MediaCard({ item, onClick }: MediaCardProps) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    if (item.status === 'ready') {
      getMediaStream(item.id).then(r => { if (mounted) setStreamUrl(r.stream_url); }).catch(() => {});
    }
    return () => { mounted = false; };
  }, [item.id, item.status]);

  // 3D tilt on mouse move
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width  - 0.5;   // -0.5 to 0.5
    const y = (e.clientY - top)  / height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 6}deg) translateY(-3px)`;
    el.style.boxShadow = `${-x * 16}px ${y * 8 + 16}px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)`;
  }, []);

  const onMouseEnter = () => {
    setHovered(true);
    if (videoRef.current) videoRef.current.play().catch(() => {});
  };

  const onMouseLeave = () => {
    setHovered(false);
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0.1; }
    const el = cardRef.current;
    if (el) {
      el.style.transform = 'perspective(700px) rotateY(0deg) rotateX(0deg) translateY(0)';
      el.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.03)';
    }
  };

  const isHls = streamUrl?.includes('.m3u8');
  const poster = item.thumbnail_url || undefined;
  const isProcessing = item.status === 'analyzing' || item.status === 'transcoding';

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      className="tilt-card relative flex flex-col cursor-pointer"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'border-color 160ms ease',
        willChange: 'transform',
      }}
    >
      {/* ── Thumbnail ── */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9', background: '#0a0a0a' }}>
        {item.status === 'ready' ? (
          <>
            {streamUrl && !isHls && (
              <div className="absolute inset-0" style={{ transform: hovered ? 'scale(1.04)' : 'scale(1)', transition: 'transform 400ms ease' }}>
                <video
                  ref={videoRef}
                  src={`${streamUrl}#t=0.1`}
                  preload="metadata" muted playsInline loop
                  onLoadedMetadata={() => setVideoLoaded(true)}
                  className="w-full h-full object-cover"
                  style={{ display: videoLoaded ? 'block' : 'none' }}
                />
              </div>
            )}
            {poster && (!videoLoaded || !hovered || isHls) && (
              <div className="absolute inset-0" style={{ transform: hovered ? 'scale(1.04)' : 'scale(1)', transition: 'transform 400ms ease', zIndex: 1 }}>
                <img src={poster} alt={item.filename} onError={() => setImageError(true)}
                  className="w-full h-full object-cover" style={{ display: imageError ? 'none' : 'block' }} />
              </div>
            )}
            {!streamUrl && !poster && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#0f0f11' }}>
                <Film size={20} style={{ color: 'var(--text-tertiary)', opacity: 0.4 }} />
              </div>
            )}
            {/* Hover overlay + play */}
            <div className="absolute inset-0 flex items-center justify-center z-10"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.12) 45%, transparent 100%)', opacity: hovered ? 1 : 0, transition: 'opacity 180ms ease' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: hovered ? 'scale(1)' : 'scale(0.8)', transition: 'transform 200ms ease',
              }}>
                <Play size={13} style={{ color: '#fff', marginLeft: 2 }} />
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0d0d0f 0%, #111114 100%)' }}>
            {isProcessing && (
              <div className="absolute inset-x-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)', animation: 'scanBeam 2.2s ease-in-out infinite' }} />
            )}
            {item.status === 'failed' ? <AlertTriangle size={18} style={{ color: 'var(--status-failed)', opacity: 0.7 }} />
              : item.status === 'pending' ? <Clock size={18} style={{ color: 'var(--status-pending)', opacity: 0.6 }} />
              : <Film size={18} style={{ color: 'var(--accent)', opacity: 0.6 }} className="animate-pulse" />}
            <span className="font-mono select-none" style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {item.status === 'failed' ? 'Failed' : item.status === 'pending' ? 'Queued' : item.status === 'analyzing' ? 'Analyzing' : 'Transcoding'}
            </span>
          </div>
        )}
        <div className="absolute top-2 right-2 z-20"><StatusBadge status={item.status} /></div>
        {item.duration && item.status === 'ready' && (
          <div className="absolute bottom-2 right-2 z-20 font-mono select-none"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', borderRadius: 4, padding: '1px 5px' }}>
            {formatCompactDuration(item.duration)}
          </div>
        )}
      </div>

      {/* Info row */}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="min-w-0">
          <p className="text-[13px] font-medium truncate leading-snug select-none"
            style={{ color: hovered ? '#fff' : 'var(--text-primary)', letterSpacing: '-0.015em', transition: 'color 150ms ease' }}>
            {item.filename}
          </p>
          <p className="font-mono select-none mt-0.5" style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
            {[item.codec, item.resolution].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
        <span className="font-mono shrink-0 select-none" style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
          {formatBytes(item.size_bytes)}
        </span>
      </div>

      <style>{`
        @keyframes scanBeam {
          0%   { top: 0%;   opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
