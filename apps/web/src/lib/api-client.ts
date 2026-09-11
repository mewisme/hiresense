'use client';

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  user: AuthUser;
}

interface ApiErrorBody {
  message?: string | string[];
  error?: string;
}

const AUTH_STORAGE_KEY = 'hiresense.auth';
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(
  /\/$/,
  '',
);

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

async function parseError(response: Response) {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {}
  const message = Array.isArray(body?.message)
    ? body.message.join(', ')
    : (body?.message ?? body?.error ?? `Request failed with status ${response.status}`);
  return new ApiError(response.status, message);
}

async function refreshSession(session: AuthSession): Promise<AuthSession | null> {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  if (!response.ok) {
    clearAuthSession();
    return null;
  }
  const next = (await response.json()) as AuthSession;
  saveAuthSession(next);
  return next;
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw await parseError(response);
  const session = (await response.json()) as AuthSession;
  saveAuthSession(session);
  return session;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const session = getAuthSession();
  const headers = new Headers(init.headers);
  if (session) headers.set('Authorization', `${session.tokenType} ${session.accessToken}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (response.status === 401 && retry && session) {
    const next = await refreshSession(session);
    if (next) return apiRequest<T>(path, init, false);
  }
  if (!response.ok) throw await parseError(response);
  return response.json() as Promise<T>;
}
