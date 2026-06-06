import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatBytes, formatDuration } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getMediaStream, type MediaItem } from '@/api/media';
import { Film, AlertTriangle, Clock, RefreshCw, Play } from 'lucide-react';

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
      videoRef.current.currentTime = 0.1;
      setIsPlaying(false);
    }
  };

  const isHls = streamUrl?.includes('.m3u8');
  const posterUrl = item.thumbnail_url || (isHls ? "/uploads/demo_poster.png" : undefined);

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] } }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden cursor-pointer"
      style={{
        boxShadow: 'var(--card-glow-subtle)',
        transition: 'border-color 180ms ease, box-shadow 180ms ease',
      }}
      // Set explicit styling attributes for shadows on hover
      onMouseEnterCapture={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-hover)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3), var(--card-glow-subtle)';
      }}
      onMouseLeaveCapture={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'var(--card-glow-subtle)';
      }}
    >
      {/* Thumbnail zone — aspect-video */}
      <div className="relative aspect-video bg-[var(--bg-elevated)] overflow-hidden">
        {/* Media preview container */}
        <div className="absolute inset-0 pointer-events-none w-full h-full">
          {item.status === 'ready' ? (
            <>
              {streamUrl && !isHls ? (
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-[1.04] w-full h-full">
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
                  </div>
                  {/* Poster Image Overlay */}
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
                    <span className="font-mono text-[10px] text-[var(--text-secondary)] select-none">{item.filename}</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-[1.04] w-full h-full">
                    <img
                      src={posterUrl}
                      alt={item.filename}
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )
              ) : null}

              {/* Hover overlay — revealed on group-hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[1]" />

              {/* Play icon that appears on hover */}
              {!isPlaying && item.status === 'ready' && (
                <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <Play size={14} className="text-white ml-0.5" />
                  </div>
                </div>
              )}

              {/* Fallback frame preview spinner if video is still loading metadata */}
              {streamUrl && !isHls && !videoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-elevated)]/60 z-[2]">
                  <div className="flex flex-col items-center gap-1.5 text-[var(--text-tertiary)] select-none">
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
                <div className="absolute inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40 top-0" 
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

                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--text-tertiary)] font-bold select-none">
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
          <div className="absolute bottom-2.5 right-2.5 z-10 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[11px] font-mono text-white/90 select-none">
            {formatDuration(item.duration)}
          </div>
        ) : null}
      </div>

      {/* Info Section */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-surface)]">
        <p className="text-[13px] font-medium text-[var(--text-primary)] truncate leading-snug tracking-[-0.01em] group-hover:text-white transition-colors duration-150 select-none">
          {item.filename}
        </p>
        <p className="text-[11px] font-mono text-[var(--text-tertiary)] mt-1 select-none">
          {[item.codec, item.resolution, item.fps && `${item.fps}fps`].filter(Boolean).join(' · ') || '—'}
        </p>
        <p className="text-[11px] font-mono text-[var(--text-tertiary)] mt-0.5 select-none">
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
