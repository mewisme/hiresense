import type { ApplicationMatchRunResponse } from '@hiresense/types';

interface MatchResultPanelProps {
  result: ApplicationMatchRunResponse;
  audience: 'candidate' | 'recruiter';
}

const componentLabels: Record<string, string> = {
  SKILL: 'Skills',
  EXPERIENCE: 'Experience',
  EDUCATION: 'Education',
};

function formatScore(value: number | null) {
  return value == null ? '—' : value.toFixed(1);
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function statusClass(status: ApplicationMatchRunResponse['skills'][number]['status']) {
  if (status === 'MATCHED') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'PARTIAL') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-rose-200 bg-rose-50 text-rose-700';
}

export function MatchResultPanel({ result, audience }: MatchResultPanelProps) {
  const matched = result.skills.filter((skill) => skill.status === 'MATCHED').length;
  const partial = result.skills.filter((skill) => skill.status === 'PARTIAL').length;
  const missing = result.skills.filter((skill) => skill.status === 'MISSING').length;

  return (
    <section className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Overall match</p>
          <div className="mt-3 flex items-end gap-1">
            <span className="text-6xl font-semibold tracking-tight text-zinc-950">{formatScore(result.overallScore)}</span>
            <span className="pb-2 text-lg text-zinc-400">/100</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-600">
            {audience === 'recruiter' ? 'Use this score as a review signal, not as an automatic hiring decision.' : 'This score summarizes how your submitted CV matches the job requirements.'}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-500">Score breakdown</p>
              <h2 className="mt-1 text-xl font-semibold text-zinc-950">Why this score?</h2>
            </div>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">{result.pipeline.code} · v{result.pipeline.semanticVersion}</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {result.components.map((component) => (
              <div key={component.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-zinc-700">{componentLabels[component.code] ?? component.code}</span>
                  <span className="text-lg font-semibold text-zinc-950">{formatScore(component.rawScore)}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200">
                  <div className="h-full rounded-full bg-zinc-900" style={{ width: `${Math.max(0, Math.min(100, component.rawScore))}%` }} />
                </div>
                <p className="mt-2 text-xs text-zinc-500">Weight {(component.weight * 100).toFixed(0)}% · contributes {formatScore(component.weightedScore)}</p>
              </div>
            ))}
            {result.components.length === 0 ? <p className="text-sm text-zinc-500">No component breakdown was recorded for this run.</p> : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-500">Skill comparison</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-950">Matched and missing requirements</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">{matched} matched</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">{partial} partial</span>
            <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">{missing} missing</span>
          </div>
        </div>

        <div className="mt-5 divide-y divide-zinc-100 rounded-xl border border-zinc-200">
          {result.skills.map((skill) => (
            <div key={skill.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-zinc-900">{skill.requirement.name}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass(skill.status)}`}>{skill.status.toLowerCase()}</span>
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600">{skill.requirement.isRequired ? 'Required' : 'Preferred'}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  {skill.resumeSkill ? `CV evidence: ${skill.resumeSkill.name}${skill.evidenceText ? ` — ${skill.evidenceText}` : ''}` : 'No normalized matching skill was found in the submitted CV.'}
                </p>
              </div>
              <div className="text-sm text-zinc-500 md:text-right">
                {skill.requirement.minExperienceMonths != null ? <p>Min. experience {skill.requirement.minExperienceMonths} months</p> : null}
                {skill.similarityScore != null ? <p>Similarity {(skill.similarityScore * 100).toFixed(0)}%</p> : null}
              </div>
            </div>
          ))}
          {result.skills.length === 0 ? <p className="p-4 text-sm text-zinc-500">No skill requirements were recorded for this analysis.</p> : null}
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600 sm:grid-cols-3">
        <div><span className="block text-xs font-medium uppercase tracking-wide text-zinc-400">Run status</span><span className="mt-1 block font-medium text-zinc-800">{result.status}</span></div>
        <div><span className="block text-xs font-medium uppercase tracking-wide text-zinc-400">Completed</span><span className="mt-1 block font-medium text-zinc-800">{formatDate(result.completedAt)}</span></div>
        <div><span className="block text-xs font-medium uppercase tracking-wide text-zinc-400">Resume language</span><span className="mt-1 block font-medium text-zinc-800">{result.resumeParseRun.detectedLanguage ?? 'Not detected'}</span></div>
      </div>
    </section>
  );
}

export function MatchResultLoading() {
  return (
    <div className="space-y-4" aria-label="Loading analysis result">
      <div className="h-48 animate-pulse rounded-2xl bg-zinc-100" />
      <div className="h-72 animate-pulse rounded-2xl bg-zinc-100" />
    </div>
  );
}

export function MatchResultEmpty({ recruiter = false, onRun }: { recruiter?: boolean; onRun?: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-zinc-900">No analysis result yet</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-600">{recruiter ? 'Run the baseline CV–job analysis to generate a reproducible score and skill breakdown for this application.' : 'The matching analysis for this application has not been completed yet.'}</p>
      {recruiter && onRun ? <button type="button" onClick={onRun} className="mt-5 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800">Run analysis</button> : null}
    </div>
  );
}

export function MatchResultError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
      <h2 className="font-semibold text-rose-900">Unable to load analysis</h2>
      <p className="mt-2 text-sm leading-6 text-rose-700">{message}</p>
      {onRetry ? <button type="button" onClick={onRetry} className="mt-4 rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100">Try again</button> : null}
    </div>
  );
}
