'use client';

import type { ApplicationMatchRunResponse } from '@hiresense/types';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { RecruiterApplicationDetail } from '@/features/applications/types';
import type { RecruitmentStageOption } from '@/features/recruiter/types';
import { ApiError, apiRequest } from '@/lib/api-client';
import {
  MatchResultEmpty,
  MatchResultError,
  MatchResultLoading,
  MatchResultPanel,
} from './match-result-panel';

const RECRUITER_TRANSITIONS: Record<string, string[]> = {
  APPLIED: ['SCREENING', 'REJECTED'],
  SCREENING: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['OFFER', 'REJECTED'],
  OFFER: ['HIRED', 'REJECTED'],
  HIRED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

interface RecruiterApplicationResultViewProps {
  companyId: string;
  applicationId: string;
}

export function RecruiterApplicationResultView({
  companyId,
  applicationId,
}: RecruiterApplicationResultViewProps) {
  const [application, setApplication] = useState<RecruiterApplicationDetail | null>(null);
  const [result, setResult] = useState<ApplicationMatchRunResponse | null>(null);
  const [stages, setStages] = useState<RecruitmentStageOption[]>([]);
  const [nextStageId, setNextStageId] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [changingStage, setChangingStage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const basePath = `/api/companies/${companyId}/applications/${applicationId}`;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [nextApplication, nextStages] = await Promise.all([
          apiRequest<RecruiterApplicationDetail>(basePath),
          apiRequest<RecruitmentStageOption[]>(`/api/companies/${companyId}/recruitment-stages`),
        ]);
        if (cancelled) return;
        setApplication(nextApplication);
        setStages(nextStages);
        try {
          const nextResult = await apiRequest<ApplicationMatchRunResponse>(
            `${basePath}/matching/current`,
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
  }, [basePath, companyId, reloadKey]);

  const allowedStages = useMemo(() => {
    if (!application) return [];
    const codes = RECRUITER_TRANSITIONS[application.currentStage.code] ?? [];
    return stages.filter((stage) => codes.includes(stage.code));
  }, [application, stages]);

  useEffect(() => {
    setNextStageId(allowedStages[0]?.id ?? '');
  }, [allowedStages]);

  async function runAnalysis() {
    setRunning(true);
    setError(null);
    try {
      setResult(
        await apiRequest<ApplicationMatchRunResponse>(`${basePath}/matching/runs`, {
          method: 'POST',
        }),
      );
    } catch (runError) {
      setError(
        runError instanceof Error ? runError.message : 'Unable to run the matching analysis.',
      );
    } finally {
      setRunning(false);
    }
  }

  async function changeStage() {
    if (!nextStageId) return;
    setChangingStage(true);
    setError(null);
    setMessage(null);
    try {
      await apiRequest(`${basePath}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stageId: nextStageId }),
      });
      setMessage('Stage updated.');
      setReloadKey((value) => value + 1);
    } catch (stageError) {
      setError(stageError instanceof Error ? stageError.message : 'Unable to change stage.');
    } finally {
      setChangingStage(false);
    }
  }

  function retry() {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }

  if (loading) return <MatchResultLoading />;
  if (!application) {
    return (
      <div>
        <MatchResultError message={error ?? 'Application not found.'} onRetry={retry} />
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-zinc-600 underline underline-offset-4"
        >
          Sign in with another account
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 border-b border-zinc-200 pb-6">
        <Link
          href={`/recruiter/companies/${companyId}/jobs/${application.jobId}/applications`}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-800"
        >
          ← Applicants
        </Link>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              {application.company.name} · {application.jobVersion.title}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
              {application.candidate.fullName}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              {application.candidate.headline ?? 'Candidate'} · CV:{' '}
              {application.resumeVersion.resume.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700">
              {application.currentStage.name}
            </span>
            <button
              type="button"
              disabled={running}
              onClick={() => void runAnalysis()}
              className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? 'Running analysis…' : result ? 'Re-run analysis' : 'Run analysis'}
            </button>
          </div>
        </div>
        {allowedStages.length > 0 ? (
          <div className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
            <div>
              <label
                htmlFor="nextStage"
                className="text-xs font-medium uppercase tracking-wide text-zinc-400"
              >
                Change stage
              </label>
              <select
                id="nextStage"
                value={nextStageId}
                onChange={(event) => setNextStageId(event.target.value)}
                className="mt-2 block rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
              >
                {allowedStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={changingStage || !nextStageId}
              onClick={() => void changeStage()}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50"
            >
              {changingStage ? 'Updating…' : 'Update stage'}
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mb-6">
          <MatchResultError message={error} />
        </div>
      ) : null}
      {message ? (
        <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {result ? (
        <MatchResultPanel result={result} audience="recruiter" />
      ) : (
        <MatchResultEmpty recruiter onRun={() => void runAnalysis()} />
      )}
    </div>
  );
}
