'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CompanyMembershipItem } from '@/features/recruiter/types';
import { apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

export function CompaniesView() {
  const router = useRouter();
  const [items, setItems] = useState<CompanyMembershipItem[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setItems(await apiRequest<CompanyMembershipItem[]>('/api/companies/me'));
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
        await reload();
      } catch (loadError) {
        if (!cancelled)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load companies.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function createCompany(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const company = await apiRequest<{ id: string }>('/api/companies', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });
      setName('');
      setDescription('');
      await reload();
      router.push(`/recruiter/companies/${company.id}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to create company.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading companies…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Companies</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Companies you own or belong to as an active member.
        </p>
      </div>
      <form
        onSubmit={(event) => void createCompany(event)}
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="companyName" className="text-sm font-medium text-zinc-700">
            Company name
          </label>
          <input
            id="companyName"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="companyDescription" className="text-sm font-medium text-zinc-700">
            Description
          </label>
          <textarea
            id="companyDescription"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
          />
        </div>
        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create company'}
        </button>
      </form>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-600">
          No companies yet.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/recruiter/companies/${item.company.id}`}
              className="block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-950">{item.company.name}</h2>
                  <p className="mt-1 text-sm text-zinc-600">{item.company.slug}</p>
                </div>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                  {item.role}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
