import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpload } from '@/hooks/useUpload';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
    if (file.size > 2 * 1024 * 1024 * 1024) { // 2GB
      toast.error('File size exceeds 2GB maximum limit');
      return;
    }

    try {
      const newMediaId = await startUpload(file);
      window.dispatchEvent(new CustomEvent('app-notification', {
          detail: { type: 'success', message: `New asset successfully uploaded: ${file.name}` }
      }));
      // Let the success state render briefly
      setTimeout(() => {
        navigate(`/media/${newMediaId}`);
      }, 800);
    } catch (err) {
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
        "relative w-full overflow-hidden bg-[var(--bg-elevated)] rounded-2xl border-2 border-dashed transition-colors duration-300 flex flex-col items-center justify-center min-h-[360px]",
        isDragging ? "border-[var(--accent)] bg-[#92400e]/10" : "border-[var(--border)] hover:border-[var(--border-hover)]",
        status !== 'uploading' ? "cursor-pointer" : ""
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center pointer-events-none"
          >
            <div id="upload-animation-container" className="w-[120px] h-[120px] mb-6 flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--border)] relative">
                <UploadCloud className="w-12 h-12 text-[var(--accent)] relative z-10" />
                {isDragging && (
                   <motion.div 
                     className="absolute inset-0 rounded-full border-2 border-[var(--accent)]"
                     animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                     transition={{ duration: 1.5, repeat: Infinity }}
                   />
                )}
            </div>
            <h3 className="font-sans text-xl font-medium text-[var(--text-primary)] mb-2">
              Drop any video
            </h3>
            <p className="text-sm font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
              MP4, MOV, MKV, HEVC, ProRes, AV1 — UP TO 2GB
            </p>
          </motion.div>
        ) : (
          <motion.div 
            key="uploading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg px-8 flex flex-col items-center"
          >
            <div className="w-full flex justify-between items-end mb-3 font-mono text-xs">
                <div className="truncate pr-4 text-[var(--status-ready)]">{currentFile?.name}</div>
                <div className="whitespace-nowrap text-[var(--text-secondary)]">{speedMBps.toFixed(1)} MB/s</div>
            </div>
            <div className="w-full h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-[var(--accent)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                />
            </div>
            <div className="w-full flex justify-between items-start mt-3 font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest">
                <div>{Math.round(progress)}% COMPLETED</div>
                {status === 'success' && <div className="text-[var(--status-ready)]">PROCESSING</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
