'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@hiresense/ui/components/alert';
import { Badge } from '@hiresense/ui/components/badge';
import { Button } from '@hiresense/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@hiresense/ui/components/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@hiresense/ui/components/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@hiresense/ui/components/select';
import { Separator } from '@hiresense/ui/components/separator';
import { Skeleton } from '@hiresense/ui/components/skeleton';
import { Spinner } from '@hiresense/ui/components/spinner';
import { Textarea } from '@hiresense/ui/components/textarea';
import { toast } from '@hiresense/ui/components/toast';
import type { PublicJobListItem, ResumeListItem } from '@/features/candidate/types';
import { ApiError, apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

export function JobDetailView({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<PublicJobListItem | null>(null);
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [resumeVersionId, setResumeVersionId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
        const [nextJob, nextResumes] = await Promise.all([
          apiRequest<PublicJobListItem>(`/api/jobs/${jobId}`),
          apiRequest<ResumeListItem[]>('/api/resumes'),
        ]);
        if (cancelled) return;
        setJob(nextJob);
        setResumes(nextResumes);
        const defaultResume =
          nextResumes.find((resume) => resume.isDefault && resume.currentVersionId) ??
          nextResumes.find((resume) => resume.currentVersionId);
        if (defaultResume?.currentVersionId) setResumeVersionId(defaultResume.currentVersionId);
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
  }, [jobId, router]);

  async function apply() {
    if (!resumeVersionId) {
      setError('Select a resume version before applying.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const application = await apiRequest<{ id: string }>(`/api/jobs/${jobId}/applications`, {
        method: 'POST',
        body: JSON.stringify({ resumeVersionId, coverLetter: coverLetter.trim() || null }),
      });
      toast.add({
        type: 'success',
        title: 'Application submitted',
        description: 'Matching will appear after a recruiter runs the baseline analysis.',
      });
      router.push(`/candidate/applications/${application.id}`);
    } catch (applyError) {
      setError(
        applyError instanceof ApiError
          ? applyError.message
          : applyError instanceof Error
            ? applyError.message
            : 'Unable to apply.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-[520px]" />
        <Skeleton className="h-80" />
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
        <AlertDescription>This published job is no longer available.</AlertDescription>
      </Alert>
    );

  const versionOptions = resumes.flatMap((resume) =>
    resume.currentVersion
      ? [
          {
            id: resume.currentVersion.id,
            label: `${resume.name} · v${resume.currentVersion.versionNo}`,
          },
        ]
      : [],
  );

  return (
    <div className="space-y-5">
      <Button variant="ghost" render={<Link href="/candidate/jobs" />}>
        <ArrowLeft />
        Back to jobs
      </Button>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{job.company.name}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{job.version.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              {job.version.employmentType ? (
                <Badge variant="outline">{job.version.employmentType}</Badge>
              ) : null}
              {job.version.workplaceType ? (
                <Badge variant="outline">{job.version.workplaceType}</Badge>
              ) : null}
              {job.version.educationMinDegree ? (
                <Badge variant="outline">{job.version.educationMinDegree}</Badge>
              ) : null}
              {job.version.experienceMinMonths != null ? (
                <Badge variant="outline">{job.version.experienceMinMonths} months minimum</Badge>
              ) : null}
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Role description</CardTitle>
              <CardDescription>
                {job.version.summary ?? 'Published job description and requirements.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {job.version.description}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>
                Structured requirements used by baseline skill matching.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {job.version.skills.length > 0 ? (
                job.version.skills.map((skill) => (
                  <Badge key={skill.skillId} variant={skill.isRequired ? 'secondary' : 'outline'}>
                    {skill.name}
                    {skill.isRequired ? ' · required' : ' · preferred'}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  No structured skill requirements.
                </span>
              )}
            </CardContent>
          </Card>
        </div>
        <Card className="xl:sticky xl:top-18">
          <CardHeader>
            <CardTitle>Apply for this role</CardTitle>
            <CardDescription>
              Your selected resume version is snapshotted with the application. Matching remains
              recruiter-triggered in V1.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {versionOptions.length === 0 ? (
              <Alert>
                <AlertTitle>Resume required</AlertTitle>
                <AlertDescription>
                  Upload a resume before applying.{' '}
                  <Link href="/candidate/resumes" className="underline underline-offset-4">
                    Manage resumes
                  </Link>
                  .
                </AlertDescription>
              </Alert>
            ) : (
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="resumeVersion">Resume version</FieldLabel>
                  <Select
                    value={resumeVersionId}
                    onValueChange={(value) => {
                      if (value != null) setResumeVersionId(value);
                    }}
                  >
                    <SelectTrigger id="resumeVersion" className="w-full">
                      <SelectValue placeholder="Select a resume">
                        {(value) =>
                          versionOptions.find((option) => option.id === value)?.label ??
                          'Select a resume'
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {versionOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    This exact version will be used for the application snapshot.
                  </FieldDescription>
                </Field>
                <Separator />
                <Field>
                  <FieldLabel htmlFor="coverLetter">Cover letter</FieldLabel>
                  <Textarea
                    id="coverLetter"
                    rows={5}
                    placeholder="Optional note for the recruiter"
                    value={coverLetter}
                    onChange={(event) => setCoverLetter(event.target.value)}
                  />
                </Field>
                {error ? (
                  <Alert variant="destructive">
                    <AlertTitle>Unable to submit</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
              </FieldGroup>
            )}
          </CardContent>
          {versionOptions.length > 0 ? (
            <CardFooter className="justify-end border-t">
              <Button type="button" disabled={submitting} onClick={() => void apply()}>
                {submitting ? (
                  <>
                    <Spinner />
                    Submitting
                  </>
                ) : (
                  <>
                    <Send />
                    Submit application
                  </>
                )}
              </Button>
            </CardFooter>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
