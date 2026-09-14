// Typed fetch client for the Saath API. Token held in localStorage for the
// MVP; production uses the httpOnly refresh cookie + short-lived access token.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1';
const TOKEN_KEY = 'saath_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

export async function api<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.auth !== false) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });

  if (res.status === 401 && getToken()) {
    // token expired — clear; app redirects on next navigation
    setToken(null);
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new ApiError(
      json?.error?.code ?? 'ERROR',
      json?.error?.message ?? 'Something went wrong',
      res.status,
    );
  }
  return (json?.data ?? json) as T;
}

export const apiBase = API_BASE;
export const socketBase = process.env.NEXT_PUBLIC_SOCKET_BASE ?? 'http://localhost:4000';

export function formatINR(paise: number | bigint | null | undefined): string {
  if (paise == null) return '—';
  const total = Number(paise);
  const rupees = Math.floor(total / 100);
  return `₹${rupees.toLocaleString('en-IN')}`;
}
