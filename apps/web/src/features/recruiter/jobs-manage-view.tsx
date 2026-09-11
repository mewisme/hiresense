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

export function JobsManageView({ companyId }: { companyId: string }) {
  const router = useRouter();
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
        const next = await apiRequest<ManagedJobListItem[]>(`/api/companies/${companyId}/jobs`);
        if (!cancelled) setJobs(next);
      } catch (loadError) {
        if (!cancelled)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load jobs.');
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
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-72" />
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description="Draft, publish, and open applicant lists for this company."
        action={
          <Button render={<Link href={`/recruiter/companies/${companyId}/jobs/new`} />}>
            <Plus />
            Create job
          </Button>
        }
      />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load jobs</AlertTitle>
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
              Create the first structured job draft for this company.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href={`/recruiter/companies/${companyId}/jobs/new`} />}>
              Create job
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}
      {!error && jobs.length > 0 ? (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Draft</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    {job.currentPublishedVersion?.title ??
                      job.currentDraftVersion?.title ??
                      job.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{job.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {job.currentDraftVersion ? `v${job.currentDraftVersion.versionNo}` : '—'}
                  </TableCell>
                  <TableCell>
                    {job.currentPublishedVersion
                      ? `v${job.currentPublishedVersion.versionNo}`
                      : '—'}
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
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
