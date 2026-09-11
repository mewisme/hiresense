'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BriefcaseBusiness, Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@hiresense/ui/components/alert';
import { Badge } from '@hiresense/ui/components/badge';
import { Button } from '@hiresense/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@hiresense/ui/components/empty';
import { Skeleton } from '@hiresense/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@hiresense/ui/components/table';
import { PageHeader } from '@/components/page/page-header';
import type { ManagedJobListItem } from '@/features/recruiter/types';
import { apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

export function CompanyHubView({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('Company');
  const [jobs, setJobs] = useState<ManagedJobListItem[]>([]);
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
        const [companyResult, nextJobs] = await Promise.all([
          apiRequest<{ company: { name: string } }>(`/api/companies/${companyId}`),
          apiRequest<ManagedJobListItem[]>(`/api/companies/${companyId}/jobs`),
        ]);
        if (cancelled) return;
        setCompanyName(companyResult.company.name);
        setJobs(nextJobs);
      } catch (loadError) {
        if (!cancelled)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load company.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId, router]);

  if (loading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-80" />
        <Skeleton className="h-72" />
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title={companyName}
        description="Manage job drafts, published openings, and applicant review for this company."
        action={
          <Button render={<Link href={`/recruiter/companies/${companyId}/jobs/new`} />}>
            <Plus />
            Create job
          </Button>
        }
      />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load company</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!error && jobs.length === 0 ? (
        <Empty className="min-h-64 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BriefcaseBusiness />
            </EmptyMedia>
            <EmptyTitle>No jobs yet</EmptyTitle>
            <EmptyDescription>
              Create a structured job draft and publish it to start receiving applications.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href={`/recruiter/companies/${companyId}/jobs/new`} />}>
              Create job
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}
      {!error && jobs.length > 0 ? <JobsTable companyId={companyId} jobs={jobs} /> : null}
    </div>
  );
}

function JobsTable({ companyId, jobs }: { companyId: string; jobs: ManagedJobListItem[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Version</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => {
            const version = job.currentPublishedVersion ?? job.currentDraftVersion;
            return (
              <TableRow key={job.id}>
                <TableCell>
                  <div className="font-medium">{version?.title ?? job.slug}</div>
                  <div className="text-xs text-muted-foreground">{job.slug}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{job.status}</Badge>
                </TableCell>
                <TableCell>
                  {version ? `${version.versionStatus} v${version.versionNo}` : 'No version'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    render={<Link href={`/recruiter/companies/${companyId}/jobs/${job.id}`} />}
                  >
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
