'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CompanyMembershipItem, RecruiterProfile } from '@/features/recruiter/types';
import { ApiError, apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

export function RecruiterHomeView() {
  const router = useRouter();
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [memberships, setMemberships] = useState<CompanyMembershipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getAuthSession();
    if (!session || !hasRole(session, 'RECRUITER')) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const [nextProfile, nextMemberships] = await Promise.all([
          apiRequest<RecruiterProfile>('/api/recruiters/me').catch((err) => {
            if (err instanceof ApiError && err.status === 404) return null;
            throw err;
          }),
          apiRequest<CompanyMembershipItem[]>('/api/companies/me'),
        ]);
        if (cancelled) return;
        setProfile(nextProfile);
        setMemberships(nextMemberships);
      } catch (loadError) {
        if (!cancelled)
          setError(
            loadError instanceof Error ? loadError.message : 'Unable to load recruiter home.',
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) return <p className="text-sm text-zinc-500">Loading recruiter workspace…</p>;
  if (error)
    return (
      <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {error}
      </p>
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          {profile ? `Welcome, ${profile.fullName}` : 'Set up your recruiter profile'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          Create a company, publish jobs with structured requirements, review applicants, and run
          baseline matching.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/recruiter/profile"
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-zinc-500">Profile</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {profile ? 'Ready' : 'Missing'}
          </p>
        </Link>
        <Link
          href="/recruiter/companies"
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-zinc-500">Companies</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">{memberships.length}</p>
        </Link>
      </div>
      {memberships[0] ? (
        <Link
          href={`/recruiter/companies/${memberships[0].company.id}/jobs`}
          className="inline-flex rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white"
        >
          Open {memberships[0].company.name} jobs
        </Link>
      ) : (
        <Link
          href="/recruiter/companies"
          className="inline-flex rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white"
        >
          Create a company
        </Link>
      )}
    </div>
  );
}
