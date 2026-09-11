'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FileCheck2 } from 'lucide-react';
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
import type { CandidateApplicationListItem } from '@/features/candidate/types';
import { apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

export function ApplicationsListView() {
  const router = useRouter();
  const [items, setItems] = useState<CandidateApplicationListItem[]>([]);
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
        const next = await apiRequest<CandidateApplicationListItem[]>(
          '/api/candidates/me/applications',
        );
        if (!cancelled) setItems(next);
      } catch (loadError) {
        if (!cancelled)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load applications.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Track recruitment stages and open explainable matching results when a recruiter has run analysis."
        action={<Button render={<Link href="/candidate/jobs" />}>Browse jobs</Button>}
      />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load applications</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {loading ? <Skeleton className="h-72" /> : null}
      {!loading && !error && items.length === 0 ? (
        <Empty className="min-h-64 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileCheck2 />
            </EmptyMedia>
            <EmptyTitle>No applications yet</EmptyTitle>
            <EmptyDescription>
              Browse published roles and submit an application with one of your resumes.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/candidate/jobs" />}>Browse jobs</Button>
          </EmptyContent>
        </Empty>
      ) : null}
      {!loading && !error && items.length > 0 ? (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.jobVersion.title}</TableCell>
                  <TableCell>{item.job.company.name}</TableCell>
                  <TableCell>
                    {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
                      new Date(item.appliedAt),
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.currentStage.name}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      render={<Link href={`/candidate/applications/${item.id}`} />}
                    >
                      View
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
