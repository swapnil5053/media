import { apiFetch } from './client';

export interface AnalyticsData {
  total_views: number;
  unique_viewers: number;
  avg_completion_rate: number | null;
}

export const getAnalytics = (mediaId: string) => 
  apiFetch<AnalyticsData>(`/media/${mediaId}/analytics`);

export const reportPlayback = (mediaId: string, slug: string, duration: number, completion: number) => 
  apiFetch(`/media/${mediaId}/playback-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, duration, completion })
  });
