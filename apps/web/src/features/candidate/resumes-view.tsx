'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ResumeListItem } from '@/features/candidate/types';
import { apiRequest, apiUpload, getAuthSession, hasRole } from '@/lib/api-client';

export function ResumesView() {
  const router = useRouter();
  const [items, setItems] = useState<ResumeListItem[]>([]);
  const [name, setName] = useState('Primary CV');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [parsingId, setParsingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function reload() {
    const next = await apiRequest<ResumeListItem[]>('/api/resumes');
    setItems(next);
  }

  useEffect(() => {
    const session = getAuthSession();
    if (!session || !hasRole(session, 'CANDIDATE')) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        await reload();
      } catch (loadError) {
        if (!cancelled)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load resumes.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError('Choose a PDF file to upload.');
      return;
    }
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.set('name', name.trim() || 'Resume');
      formData.set('file', file);
      const created = await apiUpload<{
        id: string;
        currentVersionId: string | null;
        version: { id: string };
      }>('/api/resumes', formData);
      setFile(null);
      setMessage('Resume uploaded. Parsing structured skills/experience/education…');
      if (created.version?.id) {
        setParsingId(created.id);
        await apiRequest(`/api/resumes/${created.id}/versions/${created.version.id}/parse-runs`, {
          method: 'POST',
        });
        setMessage('Resume uploaded and parsed.');
      }
      await reload();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload resume.');
    } finally {
      setUploading(false);
      setParsingId(null);
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading resumes…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Resumes</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Manage independent resumes and versioned PDF uploads. Parse runs feed baseline matching.
        </p>
      </div>
      <form
        onSubmit={(event) => void upload(event)}
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="resumeName" className="text-sm font-medium text-zinc-700">
            Resume name
          </label>
          <input
            id="resumeName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="resumeFile" className="text-sm font-medium text-zinc-700">
            PDF file
          </label>
          <input
            id="resumeFile"
            type="file"
            accept="application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-sm text-zinc-700"
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
          type="submit"
          disabled={uploading}
          className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {uploading ? (parsingId ? 'Parsing…' : 'Uploading…') : 'Upload resume'}
        </button>
      </form>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-600">
          No resumes uploaded yet.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((resume) => (
            <div
              key={resume.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-950">{resume.name}</h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    {resume.currentVersion
                      ? `Current v${resume.currentVersion.versionNo} · ${resume.currentVersion.file.originalFilename}`
                      : 'No current version'}
                  </p>
                </div>
                {resume.isDefault ? (
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                    Default
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
