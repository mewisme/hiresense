'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { PublicJobListItem } from '@/features/candidate/types';
import { apiRequest, getAuthSession, hasRole } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

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
        const path = params.size ? `/api/jobs?${params}` : '/api/jobs';
        const result = await apiRequest<{ items: PublicJobListItem[] }>(path);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Jobs</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Browse published openings and apply with a resume version.
          </p>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title or description"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 sm:max-w-xs"
        />
      </div>
      {loading ? <p className="text-sm text-zinc-500">Loading jobs…</p> : null}
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-600">
          No published jobs match this search yet.
        </p>
      ) : null}
      <div className="space-y-3">
        {items.map((job) => (
          <Link
            key={job.id}
            href={`/candidate/jobs/${job.id}`}
            className="block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-zinc-500">{job.company.name}</p>
                <h2 className="mt-1 text-xl font-semibold text-zinc-950">{job.version.title}</h2>
                <p className="mt-2 text-sm text-zinc-600">
                  {[job.version.employmentType, job.version.workplaceType]
                    .filter(Boolean)
                    .join(' · ') || 'Role details available on the job page'}
                </p>
              </div>
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                {job.status}
              </span>
            </div>
            {job.version.summary ? (
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">
                {job.version.summary}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
