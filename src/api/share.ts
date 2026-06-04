import { apiFetch } from './client';

export interface ShareConfig {
  require_password?: boolean;
  password?: string;
  view_limit?: number;
  expires_in_hours?: number;
  allow_download?: boolean;
  mobile_only?: boolean;
  desktop_only?: boolean;
}

export interface ShareLink {
  slug: string;
  url: string;
  expires_at: string | null;
  views: number;
  status: 'active' | 'expired' | 'deactivated';
  config: ShareConfig;
}

export const createShareLink = (mediaId: string, config: ShareConfig) => 
  apiFetch<{ url: string, slug: string }>(`/media/${mediaId}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });

export const getShareLinks = (mediaId: string) => 
  apiFetch<ShareLink[]>(`/media/${mediaId}/share-links`);

export const deactivateLink = (slug: string) => 
  apiFetch(`/share/${slug}`, { method: 'DELETE' });
