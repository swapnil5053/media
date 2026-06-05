import React from 'react';
import { motion } from 'framer-motion';
import { Film } from 'lucide-react';
import { cn, formatBytes, formatCompactDuration } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { MediaItem } from '@/api/media';

interface MediaCardProps {
  item: MediaItem;
  onClick: () => void;
}

function ThumbnailPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-elevated)]">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-20">
        <rect x="4" y="8" width="40" height="32" rx="2" stroke="var(--border-hover)" strokeWidth="1.5" strokeDasharray="4 3" />
        <rect x="10" y="14" width="12" height="8" rx="1" stroke="var(--border-hover)" strokeWidth="1" />
        <rect x="26" y="14" width="12" height="8" rx="1" stroke="var(--border-hover)" strokeWidth="1" />
        <rect x="10" y="26" width="12" height="8" rx="1" stroke="var(--border-hover)" strokeWidth="1" />
        <rect x="26" y="26" width="12" height="8" rx="1" stroke="var(--border-hover)" strokeWidth="1" />
        <circle cx="24" cy="24" r="6" stroke="var(--border-hover)" strokeWidth="1.5" />
        <polygon points="22,21 22,27 27,24" fill="var(--border-hover)" />
      </svg>
    </div>
  );
}

export function MediaCard({ item, onClick }: MediaCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden hover:border-[var(--border-hover)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-[border-color,box-shadow] duration-150"
    >
      {/* Thumbnail area */}
      <div className="relative aspect-video overflow-hidden">
        <ThumbnailPlaceholder />

        {/* Status badge — top right */}
        <div className="absolute top-2 right-2 z-10">
          <StatusBadge status={item.status} />
        </div>

        {/* Duration — bottom right */}
        {item.duration ? (
          <div className="absolute bottom-2 right-2 z-10 bg-black/70 px-1.5 py-0.5 rounded font-mono text-[11px] text-[var(--text-primary)]">
            {formatCompactDuration(item.duration)}
          </div>
        ) : null}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-end p-3">
          <div className="flex gap-2 items-center">
            {item.codec && (
              <span className="font-mono text-[11px] text-white/80">{item.codec}</span>
            )}
            {item.resolution && (
              <>
                <span className="text-white/30">·</span>
                <span className="font-mono text-[11px] text-white/80">{item.resolution}</span>
              </>
            )}
          </div>
        </div>

        {/* Thumbnail scale on hover */}
        <div className="absolute inset-0 group-hover:scale-[1.03] transition-transform duration-300" />
      </div>

      {/* Card body */}
      <div className="p-3">
        <div className="font-sans text-[13px] font-medium text-[var(--text-primary)] truncate mb-1">
          {item.filename}
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-tertiary)]">
          {item.codec && <span>{item.codec}</span>}
          {item.resolution && <><span>·</span><span>{item.resolution}</span></>}
          {item.fps ? <><span>·</span><span>{item.fps}fps</span></> : null}
        </div>
        <div className="font-mono text-[11px] text-[var(--text-tertiary)] mt-1">
          {formatBytes(item.size_bytes)}
          {item.status === 'ready' && ' · Ready'}
        </div>
      </div>
    </motion.div>
  );
}
