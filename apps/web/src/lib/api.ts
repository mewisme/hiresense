import { cookies } from 'next/headers';

const ACCESS_TOKEN_COOKIE = 'hiresense_access_token';
const REFRESH_TOKEN_COOKIE = 'hiresense_refresh_token';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getApiUrl() {
  return (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) throw new ApiError(401, 'Authentication required');

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${getApiUrl()}${path}`, { ...init, headers, cache: 'no-store' });
  if (!response.ok) throw new ApiError(response.status, await readApiMessage(response));
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function optionalApiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T | null> {
  try {
    return await apiRequest<T>(path, init);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function readApiMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(', ');
    if (body.message) return body.message;
  } catch {}
  return `Request failed with status ${response.status}`;
}

export const authCookies = { access: ACCESS_TOKEN_COOKIE, refresh: REFRESH_TOKEN_COOKIE } as const;
