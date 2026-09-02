import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.2em] text-emerald-400 uppercase"
        >
          HireSense
        </Link>
        <div className="max-w-xl">
          <p className="text-sm font-medium text-emerald-300">Human-in-the-loop matching</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.045em]">
            Review fit, evidence, and gaps in one place.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-400">
            Scores remain tied to exact CV, job, and algorithm versions for reproducible review.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          AI supports review. Recruiters remain responsible for hiring decisions.
        </p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <p className="text-sm font-semibold text-emerald-700 lg:hidden">HireSense</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Welcome back
          </h2>
          <p className="mt-2 mb-7 text-sm leading-6 text-slate-500">
            Sign in with an existing candidate or recruiter account.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
