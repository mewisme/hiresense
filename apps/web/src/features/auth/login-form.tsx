'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { login } from '@/lib/api-client';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      router.push('/');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">Email</label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-zinc-700">Password</label>
        <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" />
      </div>
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <button type="submit" disabled={submitting} className="w-full rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
