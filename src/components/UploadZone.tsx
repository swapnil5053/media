import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpload } from '@/hooks/useUpload';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ProgressBar } from '@/components/ui/ProgressBar';

export function UploadZone() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { status, progress, speedMBps, error, currentFile, startUpload } = useUpload();
  const navigate = useNavigate();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Only video files are supported (MP4, MOV, MKV, etc.)');
      return;
    }
    if (file.size > 2 * 1024 * 1024 * 1024) {
      toast.error('File size exceeds 2GB maximum limit');
      return;
    }

    try {
      const newMediaId = await startUpload(file);
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: { type: 'success', message: `New asset successfully uploaded: ${file.name}` }
      }));
      setTimeout(() => {
        navigate(`/media/${newMediaId}`);
      }, 800);
    } catch {
      toast.error('Upload failed. Please try again.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div
      onClick={() => status !== 'uploading' && fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative w-full bg-[var(--bg-surface)] rounded-xl border border-dashed transition-colors duration-200 flex flex-col items-center justify-center p-8',
        isDragging
          ? 'border-[var(--accent)] bg-[rgba(245,158,11,0.03)]'
          : 'border-[var(--border)] hover:border-[var(--border-hover)]',
        status !== 'uploading' ? 'cursor-pointer' : '',
        status === 'idle' || status === 'error' ? 'min-h-[200px]' : 'min-h-[140px]'
      )}
    >
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/*"
      />

      <AnimatePresence mode="wait">
        {status === 'idle' || status === 'error' ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center pointer-events-none"
          >
            <div className="relative mb-4">
              <UploadCloud className="w-6 h-6 text-[var(--accent)]" />
              {isDragging && (
                <motion.div
                  className="absolute -inset-3 rounded-full border border-[var(--accent)]/40"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>
            <h3 className="font-sans text-[15px] font-medium text-[var(--text-primary)] mb-1">
              Drop video files here
            </h3>
            <p className="font-mono text-[12px] text-[var(--text-tertiary)] tracking-[0.02em]">
              MP4 · MOV · MKV · AVI — max 2 GB
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md flex flex-col items-center"
          >
            <div className="w-full flex justify-between items-end mb-2">
              <span className="font-mono text-[12px] text-[var(--status-ready)] truncate pr-4">
                {currentFile?.name}
              </span>
              <span className="font-mono text-[12px] text-[var(--text-secondary)] whitespace-nowrap">
                {speedMBps.toFixed(1)} MB/s
              </span>
            </div>

            <ProgressBar
              value={progress}
              height={3}
              color="amber"
              animated={status === 'uploading'}
              className="mb-2"
            />

            <div className="w-full flex justify-between items-start font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.08em]">
              <span>{Math.round(progress)}% completed</span>
              {status === 'success' && (
                <span className="text-[var(--status-ready)]">Processing</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
