'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAuthSession, useAuthSession } from '@/lib/api-client';

const links = [
  { href: '/candidate', label: 'Home' },
  { href: '/candidate/jobs', label: 'Jobs' },
  { href: '/candidate/applications', label: 'Applications' },
  { href: '/candidate/resumes', label: 'Resumes' },
  { href: '/candidate/profile', label: 'Profile' },
] as const;

export function CandidateShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthSession();

  function signOut() {
    clearAuthSession();
    router.push('/login');
  }

  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/candidate" className="text-sm font-semibold tracking-tight text-zinc-950">
              HireSense
            </Link>
            <nav className="flex flex-wrap gap-1">
              {links.map((link) => {
                const active =
                  link.href === '/candidate'
                    ? pathname === link.href
                    : pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? 'bg-zinc-950 text-white'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">{session?.user.email ?? 'Candidate'}</span>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-8 sm:px-8">
        {children}
      </div>
    </div>
  );
}
