import { DELIVERY_BASE, apiFetch } from './client';

export const getDelivery = async (slug: string, password?: string) => {
  const headers: Record<string, string> = {};
  if (password) {
    headers['X-Share-Password'] = password;
  }
  
  const response = await fetch(`${DELIVERY_BASE}/s/${slug}`, { headers });
  if (!response.ok) {
    let msg = 'Failed to load';
    try {
        const errorData = await response.json();
        msg = errorData.detail || msg;
    } catch {}
    throw { status: response.status, message: msg };
  }
  return response.json();
}
