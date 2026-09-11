'use client';

import type { ApplicationMatchRunResponse } from '@hiresense/types';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import { Avatar, AvatarFallback } from '@hiresense/ui/components/avatar';
import { Button } from '@hiresense/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@hiresense/ui/components/card';
import { Field, FieldLabel } from '@hiresense/ui/components/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@hiresense/ui/components/select';
import { Spinner } from '@hiresense/ui/components/spinner';
import { toast } from '@hiresense/ui/components/toast';
import { StatusBadge } from '@/components/page/status-badge';
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

export function RecruiterApplicationResultView({
  companyId,
  applicationId,
}: {
  companyId: string;
  applicationId: string;
}) {
  const [application, setApplication] = useState<RecruiterApplicationDetail | null>(null);
  const [result, setResult] = useState<ApplicationMatchRunResponse | null>(null);
  const [stages, setStages] = useState<RecruitmentStageOption[]>([]);
  const [nextStageId, setNextStageId] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [changingStage, setChangingStage] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const selectedStageId = allowedStages.some((stage) => stage.id === nextStageId)
    ? nextStageId
    : (allowedStages[0]?.id ?? '');

  async function runAnalysis() {
    setRunning(true);
    setError(null);
    try {
      setResult(
        await apiRequest<ApplicationMatchRunResponse>(`${basePath}/matching/runs`, {
          method: 'POST',
        }),
      );
      toast.add({
        type: 'success',
        title: 'Analysis complete',
        description: 'The current baseline match result has been refreshed.',
      });
    } catch (runError) {
      setError(
        runError instanceof Error ? runError.message : 'Unable to run the matching analysis.',
      );
    } finally {
      setRunning(false);
    }
  }

  async function changeStage() {
    if (!selectedStageId) return;
    setChangingStage(true);
    setError(null);
    try {
      await apiRequest(`${basePath}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stageId: selectedStageId }),
      });
      toast.add({ type: 'success', title: 'Stage updated' });
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
  if (!application)
    return (
      <div className="space-y-4">
        <MatchResultError message={error ?? 'Application not found.'} onRetry={retry} />
        <Button variant="ghost" render={<Link href="/login" />}>
          Sign in with another account
        </Button>
      </div>
    );

  const initials = application.candidate.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        render={
          <Link href={`/recruiter/companies/${companyId}/jobs/${application.jobId}/applications`} />
        }
      >
        <ArrowLeft />
        Back to applicants
      </Button>
      <Card>
        <CardContent className="flex items-center justify-between gap-6 py-1">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {application.company.name} · {application.jobVersion.title}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                {application.candidate.fullName}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {application.candidate.headline ?? 'Candidate'} · CV{' '}
                {application.resumeVersion.resume.name} v{application.resumeVersion.versionNo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge
              status={application.currentStage.code}
              label={application.currentStage.name}
            />
            <Button disabled={running} onClick={() => void runAnalysis()}>
              {running ? (
                <>
                  <Spinner />
                  Running
                </>
              ) : (
                <>
                  <BrainCircuit />
                  {result ? 'Re-run analysis' : 'Run analysis'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      {allowedStages.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recruitment stage</CardTitle>
            <CardDescription>
              Move this application only through the transitions allowed by the V1 workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-end gap-3">
            <Field className="max-w-64">
              <FieldLabel htmlFor="nextStage">Next stage</FieldLabel>
              <Select
                value={selectedStageId}
                onValueChange={(value) => {
                  if (value != null) setNextStageId(value);
                }}
              >
                <SelectTrigger id="nextStage" className="w-full">
                  <SelectValue>
                    {(value) =>
                      allowedStages.find((stage) => stage.id === value)?.name ?? 'Select stage'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {allowedStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Button
              variant="outline"
              disabled={changingStage || !selectedStageId}
              onClick={() => void changeStage()}
            >
              {changingStage ? (
                <>
                  <Spinner />
                  Updating
                </>
              ) : (
                'Update stage'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : null}
      {error ? <MatchResultError message={error} /> : null}
      {result ? (
        <MatchResultPanel result={result} audience="recruiter" />
      ) : (
        <MatchResultEmpty recruiter onRun={() => void runAnalysis()} />
      )}
    </div>
  );
}
