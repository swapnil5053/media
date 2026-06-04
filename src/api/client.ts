export const API_BASE = '/api/v1';
export const DELIVERY_BASE = '';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const response = await fetch(url, options);
  
  if (!response.ok) {
    let message = 'An error occurred';
    try {
      const errorData = await response.json();
      message = errorData.detail || message;
    } catch {
      message = response.statusText;
    }
    throw new ApiError(response.status, message);
  }
  
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json();
}
