'use client';

import type { ApplicationMatchRunResponse } from '@hiresense/types';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CandidateApplicationDetail } from '@/features/applications/types';
import { ApiError, apiRequest } from '@/lib/api-client';
import {
  MatchResultEmpty,
  MatchResultError,
  MatchResultLoading,
  MatchResultPanel,
} from './match-result-panel';

export function CandidateApplicationResultView({ applicationId }: { applicationId: string }) {
  const [application, setApplication] = useState<CandidateApplicationDetail | null>(null);
  const [result, setResult] = useState<ApplicationMatchRunResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const nextApplication = await apiRequest<CandidateApplicationDetail>(
          `/api/candidates/me/applications/${applicationId}`,
        );
        if (cancelled) return;
        setApplication(nextApplication);
        try {
          const nextResult = await apiRequest<ApplicationMatchRunResponse>(
            `/api/candidates/me/applications/${applicationId}/matching/current`,
          );
          if (!cancelled) setResult(nextResult);
        } catch (matchError) {
          if (cancelled) return;
          if (matchError instanceof ApiError && matchError.status === 404) setResult(null);
          else throw matchError;
        }
      } catch (loadError) {
        if (!cancelled)
          setError(
            loadError instanceof Error ? loadError.message : 'Unable to load the application.',
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [applicationId, reloadKey]);

  function retry() {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }

  if (loading)
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8">
        <MatchResultLoading />
      </main>
    );
  if (error || !application) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8">
        <MatchResultError message={error ?? 'Application not found.'} onRetry={retry} />
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-zinc-600 underline underline-offset-4"
        >
          Sign in with another account
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8">
      <div className="mb-8 flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">{application.job.company.name}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            {application.jobVersion.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            CV: {application.resumeVersion.resume.name} · Applied{' '}
            {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
              new Date(application.appliedAt),
            )}
          </p>
        </div>
        <span className="w-fit rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700">
          {application.currentStage.name}
        </span>
      </div>

      {result ? <MatchResultPanel result={result} audience="candidate" /> : <MatchResultEmpty />}
    </main>
  );
}
