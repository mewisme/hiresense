import Link from 'next/link';
import { LoginForm } from '@/features/auth/login-form';

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-900">
          HireSense
        </Link>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-zinc-950">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Use your Candidate or Recruiter account to open application analysis results.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
