'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type {
  CandidateApplicationListItem,
  CandidateProfile,
  ResumeListItem,
} from '@/features/candidate/types';
import { ApiError, apiRequest, getAuthSession, hasRole } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export function CandidateHomeView() {
  const router = useRouter();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [applications, setApplications] = useState<CandidateApplicationListItem[]>([]);
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getAuthSession();
    if (!session || !hasRole(session, 'CANDIDATE')) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const [nextProfile, nextApplications, nextResumes] = await Promise.all([
          apiRequest<CandidateProfile>('/api/candidates/me').catch((err) => {
            if (err instanceof ApiError && err.status === 404) return null;
            throw err;
          }),
          apiRequest<CandidateApplicationListItem[]>('/api/candidates/me/applications').catch(
            (err) => {
              if (err instanceof ApiError && err.status === 404) return [];
              throw err;
            },
          ),
          apiRequest<ResumeListItem[]>('/api/resumes').catch((err) => {
            if (err instanceof ApiError && err.status === 404) return [];
            throw err;
          }),
        ]);
        if (cancelled) return;
        setProfile(nextProfile);
        setApplications(nextApplications);
        setResumes(nextResumes);
      } catch (loadError) {
        if (!cancelled)
          setError(
            loadError instanceof Error ? loadError.message : 'Unable to load candidate home.',
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

  if (loading) return <p className="text-sm text-zinc-500">Loading candidate workspace…</p>;
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
          {profile ? `Welcome, ${profile.fullName}` : 'Complete your candidate profile'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          Upload a CV, browse published jobs, apply with a resume version, then track your
          applications and matching results.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/candidate/profile"
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-zinc-500">Profile</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {profile ? 'Ready' : 'Missing'}
          </p>
        </Link>
        <Link
          href="/candidate/resumes"
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-zinc-500">Resumes</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">{resumes.length}</p>
        </Link>
        <Link
          href="/candidate/applications"
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-zinc-500">Applications</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">{applications.length}</p>
        </Link>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/candidate/jobs"
          className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white"
        >
          Browse jobs
        </Link>
        {!profile ? (
          <Link
            href="/candidate/profile"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800"
          >
            Create profile
          </Link>
        ) : null}
      </div>
    </div>
  );
}
