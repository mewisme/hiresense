'use client';

import type { ApplicationMatchRunResponse } from '@hiresense/types';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@hiresense/ui/components/button';
import { Card, CardContent } from '@hiresense/ui/components/card';
import { StatusBadge } from '@/components/page/status-badge';
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

  if (loading) return <MatchResultLoading />;
  if (error || !application)
    return (
      <div className="space-y-4">
        <MatchResultError message={error ?? 'Application not found.'} onRetry={retry} />
        <Button variant="ghost" render={<Link href="/login" />}>
          Sign in with another account
        </Button>
      </div>
    );

  return (
    <div className="space-y-6">
      <Button variant="ghost" render={<Link href="/candidate/applications" />}>
        <ArrowLeft />
        Back to applications
      </Button>
      <Card>
        <CardContent className="flex items-center justify-between gap-6 py-1">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {application.job.company.name}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {application.jobVersion.title}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              CV {application.resumeVersion.resume.name} · v{application.resumeVersion.versionNo} ·
              Applied{' '}
              {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
                new Date(application.appliedAt),
              )}
            </p>
          </div>
          <StatusBadge
            status={application.currentStage.code}
            label={application.currentStage.name}
          />
        </CardContent>
      </Card>
      {result ? <MatchResultPanel result={result} audience="candidate" /> : <MatchResultEmpty />}
    </div>
  );
}
