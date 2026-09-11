import { AppShell } from '@/components/app-shell/app-shell';

export default function RecruiterLayout({ children }: LayoutProps<'/recruiter'>) {
  return <AppShell role="recruiter">{children}</AppShell>;
}
