'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RecruiterProfile } from '@/features/recruiter/types';
import { ApiError, apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

export function RecruiterProfileView() {
  const router = useRouter();
  const [exists, setExists] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const session = getAuthSession();
    if (!session || !hasRole(session, 'RECRUITER')) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const profile = await apiRequest<RecruiterProfile>('/api/recruiters/me');
        if (cancelled) return;
        setExists(true);
        setFullName(profile.fullName);
        setPhone(profile.phone ?? '');
        setJobTitle(profile.jobTitle ?? '');
      } catch (loadError) {
        if (cancelled) return;
        if (loadError instanceof ApiError && loadError.status === 404) setExists(false);
        else setError(loadError instanceof Error ? loadError.message : 'Unable to load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const profile = await apiRequest<RecruiterProfile>('/api/recruiters/me', {
        method: exists ? 'PATCH' : 'POST',
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim() || null,
          jobTitle: jobTitle.trim() || null,
        }),
      });
      setExists(true);
      setFullName(profile.fullName);
      setPhone(profile.phone ?? '');
      setJobTitle(profile.jobTitle ?? '');
      setMessage('Profile saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading profile…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Recruiter profile</h1>
        <p className="mt-2 text-sm text-zinc-600">Required before managing companies and jobs.</p>
      </div>
      <form
        onSubmit={(event) => void save(event)}
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="fullName" className="text-sm font-medium text-zinc-700">
            Full name
          </label>
          <input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="jobTitle" className="text-sm font-medium text-zinc-700">
            Job title
          </label>
          <input
            id="jobTitle"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="phone" className="text-sm font-medium text-zinc-700">
            Phone
          </label>
          <input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
          />
        </div>
        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : exists ? 'Save changes' : 'Create profile'}
        </button>
      </form>
    </div>
  );
}
