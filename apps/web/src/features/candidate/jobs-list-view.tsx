'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BriefcaseBusiness, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@hiresense/ui/components/alert';
import { Badge } from '@hiresense/ui/components/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@hiresense/ui/components/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@hiresense/ui/components/input-group';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@hiresense/ui/components/item';
import { Skeleton } from '@hiresense/ui/components/skeleton';
import { PageHeader } from '@/components/page/page-header';
import type { PublicJobListItem } from '@/features/candidate/types';
import { apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

export function JobsListView() {
  const router = useRouter();
  const [items, setItems] = useState<PublicJobListItem[]>([]);
  const [query, setQuery] = useState('');
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
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        const result = await apiRequest<{ items: PublicJobListItem[] }>(
          params.size ? `/api/jobs?${params}` : '/api/jobs',
        );
        if (!cancelled) setItems(result.items);
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
  }, [query, router]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description="Browse published openings and apply with one of your current resume versions."
        action={
          <InputGroup className="w-80">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search jobs"
              aria-label="Search jobs"
            />
          </InputGroup>
        }
      />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load jobs</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <Empty className="min-h-64 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BriefcaseBusiness />
            </EmptyMedia>
            <EmptyTitle>No jobs found</EmptyTitle>
            <EmptyDescription>
              {query.trim()
                ? 'No published roles match your current search.'
                : 'There are no published roles available yet.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
      {!loading && !error && items.length > 0 ? (
        <ItemGroup className="gap-2">
          {items.map((job) => (
            <Item
              key={job.id}
              variant="outline"
              render={<Link href={`/candidate/jobs/${job.id}`} />}
              className="p-4"
            >
              <ItemContent>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{job.company.name}</span>
                  {job.version.employmentType ? (
                    <Badge variant="outline">{job.version.employmentType}</Badge>
                  ) : null}
                  {job.version.workplaceType ? (
                    <Badge variant="outline">{job.version.workplaceType}</Badge>
                  ) : null}
                </div>
                <ItemTitle className="text-base">{job.version.title}</ItemTitle>
                <ItemDescription>
                  {job.version.summary ??
                    'Open the role to review the full description and structured requirements.'}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge variant="secondary">{job.status}</Badge>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      ) : null}
    </div>
  );
}
