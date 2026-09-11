'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

  if (loading) return <p className="text-sm text-zinc-500">Loading applications…</p>;
  if (error)
    return (
      <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {error}
      </p>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Applications</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Track stage history and open matching results when available.
        </p>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-600">
          No applications yet.{' '}
          <Link href="/candidate/jobs" className="underline underline-offset-4">
            Browse jobs
          </Link>
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/candidate/applications/${item.id}`}
              className="block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-500">{item.job.company.name}</p>
                  <h2 className="mt-1 text-xl font-semibold text-zinc-950">
                    {item.jobVersion.title}
                  </h2>
                  <p className="mt-2 text-sm text-zinc-600">
                    Applied{' '}
                    {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
                      new Date(item.appliedAt),
                    )}
                  </p>
                </div>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                  {item.currentStage.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
