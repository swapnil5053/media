export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    ...init,
    headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init?.headers },
  });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (payload as { error?: string } | null)?.error ?? "Something went wrong.";
    const code = (payload as { code?: string } | null)?.code ?? "error";
    throw new ApiError(response.status, message, code);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData, onProgress?: (fraction: number) => void) =>
    new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api${path}`);
      xhr.withCredentials = true;

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) onProgress?.(event.loaded / event.total);
      });

      xhr.addEventListener("load", () => {
        const payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(payload as T);
        } else {
          reject(new ApiError(xhr.status, payload?.error ?? "Upload failed.", payload?.code ?? "error"));
        }
      });

      xhr.addEventListener("error", () => reject(new ApiError(0, "The connection dropped during upload.", "network")));
      xhr.send(formData);
    }),
};
