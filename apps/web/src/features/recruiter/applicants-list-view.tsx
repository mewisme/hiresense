'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@hiresense/ui/components/alert';
import { Avatar, AvatarFallback } from '@hiresense/ui/components/avatar';
import { Badge } from '@hiresense/ui/components/badge';
import { Button } from '@hiresense/ui/components/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@hiresense/ui/components/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@hiresense/ui/components/select';
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
import type {
  RecruiterApplicationListItem,
  RecruitmentStageOption,
} from '@/features/recruiter/types';
import { apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

export function ApplicantsListView({ companyId, jobId }: { companyId: string; jobId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<RecruiterApplicationListItem[]>([]);
  const [stages, setStages] = useState<RecruitmentStageOption[]>([]);
  const [stageId, setStageId] = useState('');
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
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (stageId) params.set('stageId', stageId);
        const [result, nextStages] = await Promise.all([
          apiRequest<{ items: RecruiterApplicationListItem[] }>(
            `/api/companies/${companyId}/jobs/${jobId}/applications${params.size ? `?${params}` : ''}`,
          ),
          apiRequest<RecruitmentStageOption[]>(`/api/companies/${companyId}/recruitment-stages`),
        ]);
        if (cancelled) return;
        setItems(result.items);
        setStages(nextStages.filter((stage) => stage.code !== 'WITHDRAWN'));
      } catch (loadError) {
        if (!cancelled)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load applicants.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId, jobId, router, stageId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applicants"
        description="Review candidates, filter by recruitment stage, and open an application to run matching."
        action={
          <Select
            value={stageId || 'ALL'}
            onValueChange={(value) => {
              if (value != null) setStageId(value === 'ALL' ? '' : value);
            }}
          >
            <SelectTrigger className="w-48" aria-label="Filter by stage">
              <SelectValue>
                {(value) =>
                  value === 'ALL'
                    ? 'All stages'
                    : (stages.find((stage) => stage.id === value)?.name ?? 'All stages')
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All stages</SelectItem>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load applicants</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {loading ? <Skeleton className="h-80" /> : null}
      {!loading && !error && items.length === 0 ? (
        <Empty className="min-h-64 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>No applicants found</EmptyTitle>
            <EmptyDescription>
              No applications match the selected recruitment stage.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
      {!loading && !error && items.length > 0 ? (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Resume</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const initials = item.candidate.fullName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('')
                  .toUpperCase();
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{item.candidate.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.candidate.headline ?? 'Candidate'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.resumeVersion.resume.name} · v{item.resumeVersion.versionNo}
                    </TableCell>
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
                        render={
                          <Link
                            href={`/recruiter/companies/${companyId}/applications/${item.id}`}
                          />
                        }
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
