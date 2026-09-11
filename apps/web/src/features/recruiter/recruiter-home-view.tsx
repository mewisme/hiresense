'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Building2, UserRound } from 'lucide-react';
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

  if (loading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-96" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title={profile ? `Welcome, ${profile.fullName}` : 'Set up your recruiter profile'}
        description="Manage companies, publish structured job requirements, review applicants, and run explainable baseline matching."
        action={
          <Button render={<Link href="/recruiter/companies" />}>
            <Building2 />
            Companies
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
          <AlertTitle>Recruiter profile required</AlertTitle>
          <AlertDescription>
            Create your recruiter profile before managing companies and jobs.{' '}
            <Link href="/recruiter/profile" className="underline underline-offset-4">
              Create profile
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
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
            <CardDescription>Company memberships</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{memberships.length}</CardTitle>
            <CardAction>
              <Building2 className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {memberships[0] ? memberships[0].company.name : 'Create your first company'}
          </CardTitle>
          <CardDescription>
            {memberships[0]
              ? 'Open the company workspace to manage jobs and applicants.'
              : 'A company workspace is required before you can publish jobs.'}
          </CardDescription>
          <CardAction>
            <Button
              variant="outline"
              render={
                <Link
                  href={
                    memberships[0]
                      ? `/recruiter/companies/${memberships[0].company.id}/jobs`
                      : '/recruiter/companies'
                  }
                />
              }
            >
              {memberships[0] ? 'Open jobs' : 'Create company'}
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  );
}
