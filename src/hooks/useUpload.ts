import { useState, useCallback, useRef } from 'react';
import { uploadMedia } from '@/api/media';

export function useUpload() {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [speedMBps, setSpeedMBps] = useState(0);
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentFile = useRef<File | null>(null);

  const startUpload = useCallback(async (file: File) => {
    try {
      setStatus('uploading');
      setProgress(0);
      setSpeedMBps(0);
      setError(null);
      currentFile.current = file;

      const response = await uploadMedia(file, (perc, speed) => {
        setProgress(perc);
        setSpeedMBps(speed);
      });

      setMediaId(response.id);
      setStatus('success');
      return response.id;
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setError(err.message || 'Upload failed');
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setSpeedMBps(0);
    setMediaId(null);
    setError(null);
    currentFile.current = null;
  }, []);

  return {
    status,
    progress,
    speedMBps,
    mediaId,
    error,
    currentFile: currentFile.current,
    startUpload,
    reset
  };
}
