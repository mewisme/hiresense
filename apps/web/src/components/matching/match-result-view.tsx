import type { ApplicationMatchRun, MatchRunComponent, MatchRunSkillResult } from '@hiresense/types';

const COMPONENT_LABELS: Record<string, string> = {
  SKILL: 'Skills',
  EXPERIENCE: 'Experience',
  EDUCATION: 'Education',
};

const EDUCATION_LABELS: Record<string, string> = {
  HIGH_SCHOOL: 'High school',
  ASSOCIATE: 'Associate',
  BACHELOR: 'Bachelor',
  MASTER: 'Master',
  DOCTORATE: 'Doctorate',
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function formatScore(value: number | null) {
  return value == null ? '—' : `${Math.round(value)}%`;
}

function detailNumber(component: MatchRunComponent, key: string) {
  const value = component.details?.[key];
  return typeof value === 'number' ? value : null;
}

function detailString(component: MatchRunComponent, key: string) {
  const value = component.details?.[key];
  return typeof value === 'string' ? value : null;
}

function monthsLabel(months: number | null) {
  if (months == null) return 'Unknown';
  if (months < 12) return `${months} mo`;
  const years = months / 12;
  return `${Number.isInteger(years) ? years : years.toFixed(1)} yr`;
}

function educationLabel(level: string | null) {
  if (!level) return 'Not specified';
  return EDUCATION_LABELS[level] ?? level.replaceAll('_', ' ').toLowerCase();
}

function ComponentCard({ component }: { component: MatchRunComponent }) {
  const score = clampScore(component.rawScore);
  const status = detailString(component, 'status');
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {COMPONENT_LABELS[component.code] ?? component.code}
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            {formatScore(component.rawScore)}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {Math.round(component.weight * 100)}% weight
        </span>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${score}%` }} />
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{componentDetail(component, status)}</p>
    </article>
  );
}

function componentDetail(component: MatchRunComponent, status: string | null) {
  if (component.code === 'EXPERIENCE') {
    const known = detailNumber(component, 'knownExperienceMonths');
    const required = detailNumber(component, 'requiredMinMonths');
    return `${monthsLabel(known)} recognized${required == null ? '' : ` · ${monthsLabel(required)} minimum`}${status ? ` · ${status.toLowerCase()}` : ''}`;
  }
  if (component.code === 'EDUCATION') {
    const candidate = detailString(component, 'highestCandidateLevel');
    const required = detailString(component, 'requiredMinLevel');
    return `${educationLabel(candidate)} recognized${required ? ` · ${educationLabel(required)} minimum` : ''}${status ? ` · ${status.toLowerCase()}` : ''}`;
  }
  const matched = detailNumber(component, 'matchedWeight');
  const total = detailNumber(component, 'totalWeight');
  if (matched != null && total != null)
    return `${matched.toFixed(2)} of ${total.toFixed(2)} weighted skill points matched`;
  return 'Deterministic structured matching component';
}

function SkillSection({
  title,
  subtitle,
  items,
  tone,
}: {
  title: string;
  subtitle: string;
  items: MatchRunSkillResult[];
  tone: 'positive' | 'warning';
}) {
  const positive = tone === 'positive';
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
        >
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="mt-5 rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
          No skills in this group.
        </p>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${positive ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}
              key={item.id}
              title={item.evidenceText ?? undefined}
            >
              {item.requirement.name}
              {item.requirement.isRequired ? (
                <span className="ml-1 opacity-60">required</span>
              ) : null}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

export function MatchResultView({ result }: { result: ApplicationMatchRun }) {
  const matched = result.skills.filter((skill) => skill.status !== 'MISSING');
  const missing = result.skills.filter((skill) => skill.status === 'MISSING');
  const score = result.overallScore == null ? 0 : clampScore(result.overallScore);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-sm">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-emerald-300 uppercase">
              CV–Job Match
            </p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-6xl font-semibold tracking-[-0.06em]">
                {formatScore(result.overallScore)}
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
              Overall fit to this job version, calculated from structured requirements and the
              parsed CV.
            </p>
          </div>
          <div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${score}%` }} />
            </div>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-2xl bg-white/[0.06] p-4">
                <p className="text-slate-400">Algorithm</p>
                <p className="mt-1 font-medium">{result.pipeline.code}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.06] p-4">
                <p className="text-slate-400">Version</p>
                <p className="mt-1 font-medium">{result.pipeline.semanticVersion}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.06] p-4">
                <p className="text-slate-400">Status</p>
                <p className="mt-1 font-medium">{result.status}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-slate-950">Score breakdown</h2>
          <p className="mt-1 text-sm text-slate-500">
            Each component shows its normalized score and effective weight in this run.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {result.components.map((component) => (
            <ComponentCard component={component} key={component.id} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <SkillSection
          title="Matched skills"
          subtitle="Required and preferred skills recognized in the parsed CV."
          items={matched}
          tone="positive"
        />
        <SkillSection
          title="Skill gaps"
          subtitle="Job requirements not recognized in the parsed CV."
          items={missing}
          tone="warning"
        />
      </div>

      <aside className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm leading-6 text-sky-950">
        <strong>Decision-support result.</strong> This score describes fit to a specific job
        description and CV snapshot. It is not a hiring decision, candidate ranking, or prediction
        of job performance.
      </aside>
    </div>
  );
}
