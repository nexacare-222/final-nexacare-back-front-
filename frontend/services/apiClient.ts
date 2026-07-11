/**
 * Thin fetch wrapper for talking to the NexaCare backend.
 *
 * - Every request sends `credentials: 'include'` so the HttpOnly
 *   `nexacare_access_token` / `nexacare_refresh_token` cookies are attached
 *   (and so the backend can set them on login/refresh).
 * - On a 401 (access token expired) we call `POST /api/auth/refresh` once
 *   and retry the original request exactly once. If the refresh itself
 *   fails, we clear local auth state and surface the failure — we never
 *   loop.
 * - `/api/auth/refresh` and `/api/auth/logout` are called directly with
 *   `fetch` (not through this wrapper) to avoid any risk of recursive
 *   refresh attempts.
 */

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const isAuthRoute = path === '/api/auth/refresh' || path === '/api/auth/login' || path === '/api/auth/login-qr';

  const doFetch = () =>
    fetch(path, {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });

  let response = await doFetch();

  if (response.status === 401 && !isAuthRoute) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await doFetch();
    } else {
      // Refresh failed — the session is gone. Drop local auth state so the
      // UI falls back to the login screen instead of spinning forever.
      const { useAuthStore } = await import('../store/useAuthStore');
      useAuthStore.getState().clearSession();
      throw new ApiError('Session expired. Please log in again.', 401);
    }
  }

  if (!response.ok) {
    const body = await parseBody(response);
    const message =
      (body && typeof body === 'object' && 'error' in body && typeof (body as any).error === 'string'
        ? (body as any).error
        : `Request failed with status ${response.status}`);
    throw new ApiError(message, response.status, body);
  }

  return (await parseBody(response)) as T;
}

export const apiGet = <T = unknown>(path: string, signal?: AbortSignal) =>
  apiFetch<T>(path, { method: 'GET', signal });

export const apiPost = <T = unknown>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: 'POST', body: body ?? {} });

export const apiPatch = <T = unknown>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: 'PATCH', body: body ?? {} });

export const apiDelete = <T = unknown>(path: string) => apiFetch<T>(path, { method: 'DELETE' });
