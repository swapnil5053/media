import React, { useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpload } from '@/hooks/useUpload';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function UploadZone() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { status, progress, speedMBps, currentFile, startUpload } = useUpload();
  const navigate = useNavigate();

  // Magnetic spring values for icon
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 200, damping: 18 });
  const sy = useSpring(my, { stiffness: 200, damping: 18 });

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoneRef.current) return;
    const { left, top, width, height } = zoneRef.current.getBoundingClientRect();
    const cx = left + width / 2;
    const cy = top + height / 2;
    mx.set((e.clientX - cx) * 0.12);
    my.set((e.clientY - cy) * 0.12);
  }, [mx, my]);

  const onMouseLeave = () => { mx.set(0); my.set(0); };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('video/')) { toast.error('Only video files are supported'); return; }
    if (file.size > 2 * 1024 * 1024 * 1024) { toast.error('File size exceeds 2 GB limit'); return; }
    try {
      const id = await startUpload(file);
      window.dispatchEvent(new CustomEvent('app-notification', { detail: { type: 'success', message: `Uploaded: ${file.name}` } }));
      setTimeout(() => navigate(`/media/${id}`), 800);
    } catch { toast.error('Upload failed'); }
  };

  const isUploading = status === 'uploading' || status === 'success';

  return (
    <div
      ref={zoneRef}
      onClick={() => !isUploading && fileInputRef.current?.click()}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
      onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
      className={cn('relative w-full rounded-xl overflow-hidden', !isUploading && 'cursor-pointer')}
      style={{
        border: `1px dashed ${isDragging ? 'rgba(245,158,11,0.7)' : 'var(--border)'}`,
        background: isDragging
          ? 'rgba(245,158,11,0.03)'
          : 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
        padding: isUploading ? '20px 24px' : '26px 24px',
        transition: 'border-color 200ms ease, background 200ms ease',
      }}
    >
      {/* Drag glow overlay */}
      {isDragging && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(245,158,11,0.06) 0%, transparent 70%)',
        }} />
      )}

      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" data-upload-trigger="true"
        onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />

      <AnimatePresence mode="wait">
        {!isUploading ? (
          <motion.div key="idle" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }} className="flex items-center gap-4 pointer-events-none">

            {/* Magnetic icon */}
            <motion.div
              style={{ x: sx, y: sy }}
              className="flex items-center justify-center shrink-0 rounded-lg"
              animate={{ borderColor: isDragging ? 'rgba(245,158,11,0.5)' : 'var(--border)' }}
              transition={{ duration: 0.2 }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: isDragging ? 'rgba(245,158,11,0.1)' : 'var(--bg-elevated)',
                border: `1px solid ${isDragging ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isDragging ? 'var(--accent)' : 'var(--text-tertiary)',
                boxShadow: isDragging ? '0 0 16px rgba(245,158,11,0.15)' : 'none',
                transition: 'all 200ms ease',
              }}>
                <UploadCloud size={16} />
              </div>
            </motion.div>

            {/* Text */}
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }} className="select-none">
                Drop video to ingest
              </p>
              <p className="font-mono select-none mt-0.5" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                MP4 · MOV · MKV · AVI &nbsp;·&nbsp; max 2 GB
              </p>
            </div>

            {/* Right browse badge */}
            <div className="ml-auto shrink-0">
              <motion.span
                whileHover={{ borderColor: 'var(--border-hover)', color: 'var(--text-secondary)' }}
                className="font-mono select-none"
                style={{
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
                  padding: '4px 8px', borderRadius: 6,
                  color: 'var(--text-tertiary)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  display: 'inline-block',
                  cursor: 'pointer',
                }}
              >
                Browse
              </motion.span>
            </div>
          </motion.div>
        ) : (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="w-full">
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-mono truncate pr-4 select-none" style={{ fontSize: 11.5, color: 'var(--text-primary)' }}>
                {currentFile?.name}
              </span>
              <span className="font-mono shrink-0 select-none" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                {speedMBps.toFixed(1)} MB/s
              </span>
            </div>
            <div style={{ height: 2, background: 'var(--bg-base)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', background: 'var(--accent)', borderRadius: 99 }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="font-mono select-none uppercase" style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>
                {Math.round(progress)}% uploaded
              </span>
              {status === 'success' && (
                <span className="font-mono select-none uppercase" style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--status-ready)' }}>
                  Processing
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
