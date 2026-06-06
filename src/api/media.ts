import { API_BASE, apiFetch } from './client';

export interface MediaItem {
  id: string;
  filename: string;
  status: 'pending' | 'analyzing' | 'transcoding' | 'ready' | 'failed';
  created_at: string;
  size_bytes: number;
  codec?: string;
  resolution?: string;
  fps?: number;
  bitrate?: number;
  duration?: number;
  hdr_type?: string;
  audio_codec?: string;
  thumbnail_url?: string;
}

export function mapMediaItem(item: any): MediaItem {
  if (!item) return item;
  return {
    id: item.id || item.media_id,
    filename: item.filename || item.original_filename || '',
    status: item.status,
    created_at: item.created_at,
    size_bytes: item.size_bytes !== undefined ? item.size_bytes : (item.file_size_bytes || 0),
    codec: item.codec || item.codec_video || '',
    resolution: item.resolution || (item.width && item.height ? `${item.width}x${item.height}` : ''),
    fps: item.fps,
    bitrate: item.bitrate || (item.bitrate_kbps ? item.bitrate_kbps * 1000 : 0),
    duration: item.duration !== undefined ? item.duration : (item.duration_seconds || 0),
    hdr_type: item.hdr_type || 'SDR',
    audio_codec: item.audio_codec || item.codec_audio || '',
    thumbnail_url: item.thumbnail_url || '',
  };
}

export const getMediaStatus = (id: string) => apiFetch<{ status: string; progress?: number }>(`/upload/${id}/status`);

export const getMedia = async (id: string) => {
  const res = await apiFetch<any>(`/media/${id}`);
  return mapMediaItem(res);
};

export const getMediaStream = (id: string) => apiFetch<{ stream_url: string }>(`/media/${id}/stream`);

export const listMedia = async (skip = 0, limit = 50) => {
  const res = await apiFetch<{ items: any[]; total: number }>(`/media?skip=${skip}&limit=${limit}`);
  return {
    items: (res.items || []).map(mapMediaItem),
    total: res.total,
    skip,
    limit,
  };
};

export const deleteMedia = (id: string) => apiFetch(`/media/${id}`, { method: 'DELETE' });

export const uploadMedia = (file: File, onProgress: (progress: number, speed: number) => void): Promise<{ id?: string; media_id?: string }> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const startTime = Date.now();
    let lastLoaded = 0;
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        
        // Calculate speed in MB/s
        const currentTime = Date.now();
        const timeDiff = (currentTime - startTime) / 1000; // seconds
        if (timeDiff > 0) {
           const speedBytesPerSec = e.loaded / timeDiff;
           const speedMBps = speedBytesPerSec / (1024 * 1024);
           onProgress(percentComplete, speedMBps);
        } else {
           onProgress(percentComplete, 0);
        }
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (err) {
          reject(new Error('Invalid response'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Network error occurred during upload'));
    });
    
    // Use FormData if endpoint expects multipart, or raw body if binary. Assuming multipart:
    const formData = new FormData();
    formData.append('file', file);
    
    xhr.open('POST', `${API_BASE}/upload`); // Endpoint needs to support this
    xhr.send(formData);
  });
};

export const optimizeMedia = (id: string) =>
  apiFetch<{ size_bytes: number; codec: string }>(`/media/${id}/optimize`, { method: 'POST' });

