'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
        const query = params.size ? `?${params}` : '';
        const [result, nextStages] = await Promise.all([
          apiRequest<{ items: RecruiterApplicationListItem[] }>(
            `/api/companies/${companyId}/jobs/${jobId}/applications${query}`,
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href={`/recruiter/companies/${companyId}/jobs/${jobId}`}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-800"
          >
            ← Job
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">Applicants</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Open an applicant to run matching and change recruitment stage.
          </p>
        </div>
        <select
          value={stageId}
          onChange={(event) => setStageId(event.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm"
        >
          <option value="">All stages</option>
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
      </div>
      {loading ? <p className="text-sm text-zinc-500">Loading applicants…</p> : null}
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-600">
          No applicants in this filter.
        </p>
      ) : null}
      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/recruiter/companies/${companyId}/applications/${item.id}`}
            className="block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">{item.candidate.fullName}</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {item.candidate.headline ?? 'Candidate'} · CV {item.resumeVersion.resume.name}
                </p>
              </div>
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                {item.currentStage.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
