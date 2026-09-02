import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-emerald-400 uppercase">
              HireSense
            </p>
            <p className="mt-1 text-sm text-slate-400">AI-assisted recruitment decision support</p>
          </div>
          <Link
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
            href="/login"
          >
            Sign in
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-300 uppercase">
              Baseline matching v1
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.045em] text-balance sm:text-6xl">
              Understand CV–job fit without reading raw analysis JSON.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              HireSense turns structured CV and job requirements into a reproducible score with
              skill, experience, and education breakdowns. The result supports human review; it does
              not make hiring decisions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                href="/login"
              >
                Open workspace
              </Link>
              <span className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-slate-400">
                Skills · Experience · Education
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Example result</p>
                <p className="mt-1 text-xl font-semibold">Backend Developer</p>
              </div>
              <div className="rounded-2xl bg-emerald-400/10 px-4 py-3 text-right">
                <p className="text-3xl font-semibold text-emerald-300">84%</p>
                <p className="text-xs text-emerald-200/70">overall fit</p>
              </div>
            </div>
            <div className="mt-8 space-y-5">
              {[
                ['Skills', 92],
                ['Experience', 76],
                ['Education', 80],
              ].map(([label, score]) => (
                <div key={label}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="font-medium">{score}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-2 text-xs">
              {['TypeScript', 'NestJS', 'PostgreSQL', 'Docker'].map((skill) => (
                <span className="rounded-full bg-white/10 px-3 py-1.5" key={skill}>
                  {skill}
                </span>
              ))}
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-amber-200">
                Redis missing
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
