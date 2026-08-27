'use client';

import type { ApplicationMatchRunResponse } from '@hiresense/types';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { RecruiterApplicationDetail } from '@/features/applications/types';
import { ApiError, apiRequest } from '@/lib/api-client';
import { MatchResultEmpty, MatchResultError, MatchResultLoading, MatchResultPanel } from './match-result-panel';

interface RecruiterApplicationResultViewProps {
  companyId: string;
  applicationId: string;
}

export function RecruiterApplicationResultView({ companyId, applicationId }: RecruiterApplicationResultViewProps) {
  const [application, setApplication] = useState<RecruiterApplicationDetail | null>(null);
  const [result, setResult] = useState<ApplicationMatchRunResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const basePath = `/api/companies/${companyId}/applications/${applicationId}`;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const nextApplication = await apiRequest<RecruiterApplicationDetail>(basePath);
        if (cancelled) return;
        setApplication(nextApplication);
        try {
          const nextResult = await apiRequest<ApplicationMatchRunResponse>(`${basePath}/matching/current`);
          if (!cancelled) setResult(nextResult);
        } catch (matchError) {
          if (cancelled) return;
          if (matchError instanceof ApiError && matchError.status === 404) setResult(null);
          else throw matchError;
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load the application.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [basePath, reloadKey]);

  async function runAnalysis() {
    setRunning(true);
    setError(null);
    try {
      setResult(await apiRequest<ApplicationMatchRunResponse>(`${basePath}/matching/runs`, { method: 'POST' }));
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Unable to run the matching analysis.');
    } finally {
      setRunning(false);
    }
  }

  function retry() {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }

  if (loading) return <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8"><MatchResultLoading /></main>;
  if (!application) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8">
        <MatchResultError message={error ?? 'Application not found.'} onRetry={retry} />
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-zinc-600 underline underline-offset-4">Sign in with another account</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8">
      <div className="mb-8 border-b border-zinc-200 pb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">{application.company.name} · {application.jobVersion.title}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">{application.candidate.fullName}</h1>
            <p className="mt-2 text-sm text-zinc-500">{application.candidate.headline ?? 'Candidate'} · CV: {application.resumeVersion.resume.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700">{application.currentStage.name}</span>
            <button type="button" disabled={running} onClick={() => void runAnalysis()} className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50">{running ? 'Running analysis…' : result ? 'Re-run analysis' : 'Run analysis'}</button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 text-sm text-zinc-600 sm:grid-cols-3">
          <div className="rounded-xl bg-zinc-50 p-3"><span className="block text-xs uppercase tracking-wide text-zinc-400">Applied</span><span className="mt-1 block font-medium text-zinc-800">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(application.appliedAt))}</span></div>
          <div className="rounded-xl bg-zinc-50 p-3"><span className="block text-xs uppercase tracking-wide text-zinc-400">Declared experience</span><span className="mt-1 block font-medium text-zinc-800">{application.candidate.experienceMonthsDeclared == null ? 'Not provided' : `${application.candidate.experienceMonthsDeclared} months`}</span></div>
          <div className="rounded-xl bg-zinc-50 p-3"><span className="block text-xs uppercase tracking-wide text-zinc-400">Location</span><span className="mt-1 block font-medium text-zinc-800">{[application.candidate.city, application.candidate.region, application.candidate.countryCode].filter(Boolean).join(', ') || 'Not provided'}</span></div>
        </div>
      </div>

      {error ? <div className="mb-6"><MatchResultError message={error} /></div> : null}
      {result ? <MatchResultPanel result={result} audience="recruiter" /> : <MatchResultEmpty recruiter onRun={() => void runAnalysis()} />}
    </main>
  );
}
