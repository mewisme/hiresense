'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authCookies, getApiUrl, readApiMessage } from '@/lib/api';

export interface LoginState {
  message?: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  user: { roles: string[] };
}

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { message: 'Email and password are required.' };

  const response = await fetch(`${getApiUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });
  if (!response.ok) return { message: await readApiMessage(response) };

  const auth = (await response.json()) as AuthResponse;
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  cookieStore.set(authCookies.access, auth.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: auth.accessTokenExpiresIn,
  });
  cookieStore.set(authCookies.refresh, auth.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: auth.refreshTokenExpiresIn,
  });
  redirect('/workspace');
}
