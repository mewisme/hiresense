'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

interface JobDetailResponse {
  id: string;
  slug: string;
  status: string;
  currentDraftVersion: {
    id: string;
    versionNo: number;
    versionStatus: string;
    title: string;
    summary: string | null;
    description: string;
    experienceMinMonths: number | null;
    educationMinDegree: string | null;
    skills?: Array<{ skillId: string; name: string; isRequired: boolean }>;
  } | null;
  currentPublishedVersion: {
    id: string;
    versionNo: number;
    versionStatus: string;
    title: string;
    summary: string | null;
    description: string;
    experienceMinMonths: number | null;
    educationMinDegree: string | null;
    skills?: Array<{ skillId: string; name: string; isRequired: boolean }>;
  } | null;
}

export function JobDetailManageView({ companyId, jobId }: { companyId: string; jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<JobDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function reload() {
    setJob(await apiRequest<JobDetailResponse>(`/api/companies/${companyId}/jobs/${jobId}`));
  }

  useEffect(() => {
    const session = getAuthSession();
    if (!session || !hasRole(session, 'RECRUITER')) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const next = await apiRequest<JobDetailResponse>(
          `/api/companies/${companyId}/jobs/${jobId}`,
        );
        if (!cancelled) setJob(next);
      } catch (loadError) {
        if (!cancelled)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load job.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId, jobId, router]);

  async function publish() {
    setPublishing(true);
    setError(null);
    setMessage(null);
    try {
      await apiRequest(`/api/companies/${companyId}/jobs/${jobId}/publish`, { method: 'POST' });
      await reload();
      setMessage('Job published.');
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Unable to publish job.');
    } finally {
      setPublishing(false);
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading job…</p>;
  if (error && !job)
    return (
      <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {error}
      </p>
    );
  if (!job) return <p className="text-sm text-zinc-500">Job not found.</p>;

  const version = job.currentPublishedVersion ?? job.currentDraftVersion;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/recruiter/companies/${companyId}/jobs`}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-800"
          >
            ← Jobs
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
            {version?.title ?? job.slug}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Status {job.status}
            {version ? ` · ${version.versionStatus} v${version.versionNo}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {job.currentDraftVersion ? (
            <button
              type="button"
              disabled={publishing}
              onClick={() => void publish()}
              className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {publishing ? 'Publishing…' : 'Publish draft'}
            </button>
          ) : null}
          {job.currentPublishedVersion ? (
            <Link
              href={`/recruiter/companies/${companyId}/jobs/${jobId}/applications`}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800"
            >
              View applicants
            </Link>
          ) : null}
        </div>
      </div>
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {version ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">
            {version.description}
          </p>
          <p className="mt-4 text-sm text-zinc-600">
            Experience min: {version.experienceMinMonths ?? 'n/a'} · Education min:{' '}
            {version.educationMinDegree ?? 'not required'}
          </p>
          {version.skills && version.skills.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {version.skills.map((skill) => (
                <li
                  key={skill.skillId}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700"
                >
                  {skill.name}
                  {skill.isRequired ? ' · required' : ''}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
