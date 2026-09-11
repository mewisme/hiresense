import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-5 py-16">
      <div className="w-full max-w-5xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold tracking-tight text-zinc-900">HireSense</p>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
              Explainable CV–job matching for recruitment workflows.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600">
              HireSense turns CV and job requirements into structured, versioned analysis with an
              overall score, component breakdown, matched skills, missing skills, and evidence.
            </p>
          </div>
          <div className="rounded-2xl bg-zinc-950 p-6 text-white">
            <p className="text-sm font-medium text-zinc-300">Week 9 · AI result UI</p>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Sign in, then open an application from the Candidate or Recruiter workflow to inspect
              its matching result.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Sign in
            </Link>
            <Link
              href="/candidate"
              className="mt-3 inline-flex rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Candidate workspace
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
