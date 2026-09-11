'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, FileCheck2, Files, UserRound } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@hiresense/ui/components/alert';
import { Badge } from '@hiresense/ui/components/badge';
import { Button } from '@hiresense/ui/components/button';
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@hiresense/ui/components/card';
import { Skeleton } from '@hiresense/ui/components/skeleton';
import { PageHeader } from '@/components/page/page-header';
import type {
  CandidateApplicationListItem,
  CandidateProfile,
  ResumeListItem,
} from '@/features/candidate/types';
import { ApiError, apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

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

  if (loading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-96 max-w-full" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title={profile ? `Welcome, ${profile.fullName}` : 'Complete your candidate profile'}
        description="Upload a CV, browse published roles, apply with a resume version, and track matching results from one workspace."
        action={
          <Button render={<Link href="/candidate/jobs" />}>
            <BriefcaseBusiness />
            Browse jobs
          </Button>
        }
      />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load workspace</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!profile ? (
        <Alert>
          <UserRound />
          <AlertTitle>Your profile is not ready</AlertTitle>
          <AlertDescription>
            Complete your candidate profile before applying for jobs.{' '}
            <Link href="/candidate/profile" className="underline underline-offset-4">
              Create profile
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Profile</CardDescription>
            <CardTitle className="text-2xl">{profile ? 'Ready' : 'Missing'}</CardTitle>
            <CardAction>
              <Badge variant={profile ? 'secondary' : 'outline'}>
                {profile ? 'Complete' : 'Action needed'}
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Resumes</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{resumes.length}</CardTitle>
            <CardAction>
              <Files className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Applications</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{applications.length}</CardTitle>
            <CardAction>
              <FileCheck2 className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Continue your workflow</CardTitle>
          <CardDescription>
            {resumes.length === 0
              ? 'Upload and parse a resume before applying.'
              : applications.length === 0
                ? 'Your resume is ready. Browse published jobs and submit your first application.'
                : 'Review your applications and matching results.'}
          </CardDescription>
          <CardAction>
            <Button
              variant="outline"
              render={
                <Link
                  href={
                    resumes.length === 0
                      ? '/candidate/resumes'
                      : applications.length === 0
                        ? '/candidate/jobs'
                        : '/candidate/applications'
                  }
                />
              }
            >
              {resumes.length === 0
                ? 'Manage resumes'
                : applications.length === 0
                  ? 'Find jobs'
                  : 'View applications'}
              <ArrowRight />
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  );
}
