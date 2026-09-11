import Link from 'next/link';
import { BriefcaseBusiness } from 'lucide-react';
import { LoginForm } from '@/features/auth/login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BriefcaseBusiness className="size-4" />
          </span>
          HireSense
        </Link>
        <LoginForm />
      </div>
    </main>
  );
}
