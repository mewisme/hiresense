'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SkillOption } from '@/features/recruiter/types';
import { apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

export function JobCreateView({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [experienceMinMonths, setExperienceMinMonths] = useState('12');
  const [educationMinDegree, setEducationMinDegree] = useState('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getAuthSession();
    if (!session || !hasRole(session, 'RECRUITER')) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const next = await apiRequest<SkillOption[]>('/api/skills');
        if (!cancelled) setSkills(next);
      } catch (loadError) {
        if (!cancelled)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load skills.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function toggleSkill(skillId: string) {
    setSelectedSkillIds((current) =>
      current.includes(skillId) ? current.filter((id) => id !== skillId) : [...current, skillId],
    );
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (selectedSkillIds.length === 0) {
      setError('Select at least one skill requirement.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await apiRequest<{ id: string }>(`/api/companies/${companyId}/jobs`, {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          experienceMinMonths: experienceMinMonths.trim() ? Number(experienceMinMonths) : null,
          educationMinDegree: educationMinDegree || null,
          skills: selectedSkillIds.map((skillId) => ({
            skillId,
            isRequired: true,
            importance: 3,
            weight: '1',
          })),
        }),
      });
      router.push(`/recruiter/companies/${companyId}/jobs/${result.id}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to create job.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading skill catalog…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Create job</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Draft a job with structured skills, experience, and optional education requirements.
        </p>
      </div>
      <form
        onSubmit={(event) => void create(event)}
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="title" className="text-sm font-medium text-zinc-700">
            Title
          </label>
          <input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="description" className="text-sm font-medium text-zinc-700">
            Description
          </label>
          <textarea
            id="description"
            required
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="experienceMinMonths" className="text-sm font-medium text-zinc-700">
              Min experience (months)
            </label>
            <input
              id="experienceMinMonths"
              type="number"
              min={0}
              value={experienceMinMonths}
              onChange={(e) => setExperienceMinMonths(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="educationMinDegree" className="text-sm font-medium text-zinc-700">
              Min education
            </label>
            <select
              id="educationMinDegree"
              value={educationMinDegree}
              onChange={(e) => setEducationMinDegree(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
            >
              <option value="">Not required</option>
              <option value="HIGH_SCHOOL">High school</option>
              <option value="ASSOCIATE">Associate</option>
              <option value="BACHELOR">Bachelor</option>
              <option value="MASTER">Master</option>
              <option value="DOCTORATE">Doctorate</option>
            </select>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-700">Skills</p>
          <div className="mt-3 flex max-h-64 flex-wrap gap-2 overflow-y-auto rounded-xl border border-zinc-200 p-3">
            {skills.map((skill) => {
              const selected = selectedSkillIds.includes(skill.id);
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    selected
                      ? 'border-zinc-950 bg-zinc-950 text-white'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-700'
                  }`}
                >
                  {skill.name}
                </button>
              );
            })}
          </div>
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
          {saving ? 'Creating…' : 'Create draft job'}
        </button>
      </form>
    </div>
  );
}
