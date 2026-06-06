import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatBytes, formatDuration } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getMediaStream, type MediaItem } from '@/api/media';
import { Film, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

interface MediaCardProps {
  item: MediaItem;
  onClick: () => void;
}

export function MediaCard({ item, onClick }: MediaCardProps) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (item.status === 'ready') {
      getMediaStream(item.id)
        .then(res => {
          if (mounted) {
            setStreamUrl(res.stream_url);
          }
        })
        .catch(console.error);
    }
    return () => { mounted = false; };
  }, [item.id, item.status]);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      // Seek back to 0.1s to maintain the first frame thumbnail
      videoRef.current.currentTime = 0.1;
      setIsPlaying(false);
    }
  };

  const isHls = streamUrl?.includes('.m3u8');
  // Local cover image for the pre-seeded Big Buck Bunny HLS stream or uploaded video thumbnail
  const posterUrl = item.thumbnail_url || (isHls ? "/uploads/demo_poster.png" : undefined);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group flex flex-col bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--border-hover)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)] transition-[border-color,box-shadow] duration-200 cursor-pointer"
    >
      {/* Thumbnail zone — aspect-video */}
      <div className="relative aspect-video bg-[var(--bg-elevated)] overflow-hidden">
        {/* Media preview container — not animated or scaled to satisfy the design guidelines */}
        <div className="absolute inset-0 pointer-events-none w-full h-full">
          {item.status === 'ready' ? (
            <>
              {streamUrl && !isHls ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    src={`${streamUrl}#t=0.1`}
                    preload="metadata"
                    muted
                    playsInline
                    loop
                    onLoadedData={() => setVideoLoaded(true)}
                    onLoadedMetadata={() => setVideoLoaded(true)}
                    className="w-full h-full object-cover bg-black"
                  />
                  {posterUrl && !isPlaying && (
                    <img
                      src={posterUrl}
                      alt={item.filename}
                      className="absolute inset-0 w-full h-full object-cover z-[1] transition-opacity duration-300"
                    />
                  )}
                </div>
              ) : isHls ? (
                imageError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#121212] to-[var(--bg-elevated)]">
                    <Film className="w-8 h-8 text-[var(--accent)] opacity-60 mb-2 animate-pulse" />
                    <span className="font-mono text-[10px] text-[var(--text-secondary)]">{item.filename}</span>
                  </div>
                ) : (
                  <img
                    src={posterUrl}
                    alt={item.filename}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                )
              ) : null}

              {/* Fallback frame preview spinner if video is still loading metadata */}
              {streamUrl && !isHls && !videoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-elevated)]/60 z-[2]">
                  <div className="flex flex-col items-center gap-1.5 text-[var(--text-tertiary)]">
                    <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent)]" />
                    <span className="font-mono text-[9px] uppercase tracking-widest">Loading Frame</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Processing and state-specific visual placeholders */
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#121212] to-[var(--bg-elevated)]">
              {/* Scanning laser beam animation for active jobs */}
              {(item.status === 'analyzing' || item.status === 'transcoding') && (
                <div className="absolute inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40 top-0 animate-[shimmer_2s_infinite_linear]" 
                  style={{
                    animationName: 'scanBeam',
                    animationDuration: '2.5s',
                    animationIterationCount: 'infinite',
                    animationTimingFunction: 'ease-in-out'
                  }}
                />
              )}

              <div className="flex flex-col items-center gap-2 text-center px-4">
                {item.status === 'failed' ? (
                  <AlertTriangle className="w-6 h-6 text-[var(--status-failed)] opacity-80" />
                ) : item.status === 'pending' ? (
                  <Clock className="w-6 h-6 text-[var(--status-pending)] opacity-80 animate-pulse" />
                ) : (
                  <Film className="w-6 h-6 text-[var(--accent)] opacity-80 animate-pulse" />
                )}

                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--text-tertiary)] font-bold">
                  {item.status === 'failed' 
                    ? 'Failed' 
                    : item.status === 'pending' 
                    ? 'Pending Ingest' 
                    : item.status === 'analyzing' 
                    ? 'Analyzing Format' 
                    : 'Transcoding Stream'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Status badges */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <StatusBadge status={item.status} />
        </div>
        {item.duration ? (
          <div className="absolute bottom-2.5 right-2.5 z-10 bg-black/85 px-1.5 py-0.5 rounded text-[11px] font-mono text-white tracking-wide border border-white/5">
            {formatDuration(item.duration)}
          </div>
        ) : null}
      </div>

      {/* Info Section */}
      <div className="p-3.5 border-t border-[var(--border)] bg-[var(--bg-surface)]">
        <p className="text-[13.5px] font-semibold text-[var(--text-primary)] truncate leading-snug tracking-[-0.01em]">
          {item.filename}
        </p>
        <p className="text-[11px] font-mono text-[var(--text-tertiary)] mt-1.5">
          {[item.codec, item.resolution, item.fps && `${item.fps}fps`].filter(Boolean).join(' · ') || '—'}
        </p>
        <p className="text-[11px] font-mono text-[var(--text-tertiary)] mt-0.5">
          {formatBytes(item.size_bytes)}
        </p>
      </div>
      
      {/* Dynamic Keyframe style block for scanning laser line */}
      <style>{`
        @keyframes scanBeam {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </motion.div>
  );
}
