'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PublicJobListItem, ResumeListItem } from '@/features/candidate/types';
import { ApiError, apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

export function JobDetailView({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<PublicJobListItem | null>(null);
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [resumeVersionId, setResumeVersionId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const session = getAuthSession();
    if (!session || !hasRole(session, 'CANDIDATE')) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const [nextJob, nextResumes] = await Promise.all([
          apiRequest<PublicJobListItem>(`/api/jobs/${jobId}`),
          apiRequest<ResumeListItem[]>('/api/resumes'),
        ]);
        if (cancelled) return;
        setJob(nextJob);
        setResumes(nextResumes);
        const defaultResume =
          nextResumes.find((resume) => resume.isDefault && resume.currentVersionId) ??
          nextResumes.find((resume) => resume.currentVersionId);
        if (defaultResume?.currentVersionId) setResumeVersionId(defaultResume.currentVersionId);
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
  }, [jobId, router]);

  async function apply() {
    if (!resumeVersionId) {
      setError('Select a resume version before applying.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const application = await apiRequest<{ id: string }>(`/api/jobs/${jobId}/applications`, {
        method: 'POST',
        body: JSON.stringify({
          resumeVersionId,
          coverLetter: coverLetter.trim() || null,
        }),
      });
      setMessage('Application submitted. Matching starts after a recruiter runs analysis.');
      router.push(`/candidate/applications/${application.id}`);
    } catch (applyError) {
      setError(
        applyError instanceof ApiError
          ? applyError.message
          : applyError instanceof Error
            ? applyError.message
            : 'Unable to apply.',
      );
    } finally {
      setSubmitting(false);
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

  const versionOptions = resumes.flatMap((resume) =>
    resume.currentVersion
      ? [
          {
            id: resume.currentVersion.id,
            label: `${resume.name} · v${resume.currentVersion.versionNo}`,
          },
        ]
      : [],
  );

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/candidate/jobs"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-800"
        >
          ← Jobs
        </Link>
        <p className="mt-4 text-sm font-medium text-zinc-500">{job.company.name}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
          {job.version.title}
        </h1>
        <p className="mt-3 text-sm text-zinc-600">
          {[job.version.employmentType, job.version.workplaceType, job.version.educationMinDegree]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-950">Description</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
          {job.version.description}
        </p>
        {job.version.skills.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-zinc-500">Skills</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {job.version.skills.map((skill) => (
                <li
                  key={skill.skillId}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700"
                >
                  {skill.name}
                  {skill.isRequired ? ' · required' : ''}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-950">Apply</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Choose the resume version to snapshot with this application. Matching is
          recruiter-triggered after apply.
        </p>
        {versionOptions.length === 0 ? (
          <p className="mt-4 text-sm text-amber-700">
            Upload a resume first.{' '}
            <Link href="/candidate/resumes" className="underline underline-offset-4">
              Manage resumes
            </Link>
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="resumeVersion" className="text-sm font-medium text-zinc-700">
                Resume version
              </label>
              <select
                id="resumeVersion"
                value={resumeVersionId}
                onChange={(event) => setResumeVersionId(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm"
              >
                {versionOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="coverLetter" className="text-sm font-medium text-zinc-700">
                Cover letter (optional)
              </label>
              <textarea
                id="coverLetter"
                value={coverLetter}
                onChange={(event) => setCoverLetter(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm"
              />
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
            <button
              type="button"
              disabled={submitting}
              onClick={() => void apply()}
              className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
