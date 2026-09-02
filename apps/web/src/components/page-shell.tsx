import Link from 'next/link';
import type { ReactNode } from 'react';

export function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-10">
          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.2em] text-emerald-700 uppercase"
          >
            HireSense
          </Link>
          <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-slate-950">
            Switch account
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-700 uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {children}
      </div>
    </main>
  );
}
