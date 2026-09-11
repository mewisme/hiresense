'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Send, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@hiresense/ui/components/alert';
import { Badge } from '@hiresense/ui/components/badge';
import { Button } from '@hiresense/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@hiresense/ui/components/card';
import { Separator } from '@hiresense/ui/components/separator';
import { Skeleton } from '@hiresense/ui/components/skeleton';
import { Spinner } from '@hiresense/ui/components/spinner';
import { toast } from '@hiresense/ui/components/toast';
import { apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

interface JobDetailResponse {
  id: string;
  slug: string;
  status: string;
  currentDraftVersion: JobVersionDetail | null;
  currentPublishedVersion: JobVersionDetail | null;
}

interface JobVersionDetail {
  id: string;
  versionNo: number;
  versionStatus: string;
  title: string;
  summary: string | null;
  description: string;
  experienceMinMonths: number | null;
  educationMinDegree: string | null;
  skills?: Array<{ skillId: string; name: string; isRequired: boolean }>;
}

export function JobDetailManageView({ companyId, jobId }: { companyId: string; jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<JobDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setJob(await apiRequest<JobDetailResponse>(`/api/companies/${companyId}/jobs/${jobId}`));
  }

  useEffect(() => {
    const session = getAuthSession();
    if (!session || !hasRole(session, 'RECRUITER')) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const next = await apiRequest<JobDetailResponse>(
          `/api/companies/${companyId}/jobs/${jobId}`,
        );
        if (!cancelled) setJob(next);
      } catch (loadError) {
        if (!cancelled)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load job.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId, jobId, router]);

  async function publish() {
    setPublishing(true);
    setError(null);
    try {
      await apiRequest(`/api/companies/${companyId}/jobs/${jobId}/publish`, { method: 'POST' });
      await reload();
      toast.add({
        type: 'success',
        title: 'Job published',
        description: 'Candidates can now discover and apply to this opening.',
      });
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Unable to publish job.');
    } finally {
      setPublishing(false);
    }
  }

  if (loading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96" />
      </div>
    );
  if (error && !job)
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load job</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  if (!job)
    return (
      <Alert>
        <AlertTitle>Job not found</AlertTitle>
        <AlertDescription>The requested job is unavailable.</AlertDescription>
      </Alert>
    );

  const version = job.currentPublishedVersion ?? job.currentDraftVersion;

  return (
    <div className="space-y-6">
      <Button variant="ghost" render={<Link href={`/recruiter/companies/${companyId}/jobs`} />}>
        <ArrowLeft />
        Back to jobs
      </Button>
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{version?.title ?? job.slug}</h1>
            <Badge variant="outline">{job.status}</Badge>
            {version ? (
              <Badge variant="secondary">
                {version.versionStatus} v{version.versionNo}
              </Badge>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Review the current job version, publish drafts, and open the applicant pipeline.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {job.currentDraftVersion ? (
            <Button disabled={publishing} onClick={() => void publish()}>
              {publishing ? (
                <>
                  <Spinner />
                  Publishing
                </>
              ) : (
                <>
                  <Send />
                  Publish draft
                </>
              )}
            </Button>
          ) : null}
          {job.currentPublishedVersion ? (
            <Button
              variant="outline"
              render={
                <Link href={`/recruiter/companies/${companyId}/jobs/${jobId}/applications`} />
              }
            >
              <Users />
              View applicants
            </Button>
          ) : null}
        </div>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Job action failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {version ? (
        <Card>
          <CardHeader>
            <CardTitle>Published content</CardTitle>
            <CardDescription>
              {version.summary ?? 'Job description and structured baseline requirements.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {version.description}
            </p>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-muted-foreground">Minimum experience</div>
                <div className="mt-1 text-sm font-medium">
                  {version.experienceMinMonths == null
                    ? 'Not required'
                    : `${version.experienceMinMonths} months`}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Minimum education</div>
                <div className="mt-1 text-sm font-medium">
                  {version.educationMinDegree ?? 'Not required'}
                </div>
              </div>
            </div>
            {version.skills && version.skills.length > 0 ? (
              <>
                <Separator />
                <div>
                  <div className="mb-2 text-xs font-medium text-muted-foreground">Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {version.skills.map((skill) => (
                      <Badge
                        key={skill.skillId}
                        variant={skill.isRequired ? 'secondary' : 'outline'}
                      >
                        {skill.name}
                        {skill.isRequired ? ' · required' : ' · preferred'}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
