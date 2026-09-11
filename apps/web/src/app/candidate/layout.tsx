import { AppShell } from '@/components/app-shell/app-shell';

export default function CandidateLayout({ children }: LayoutProps<'/candidate'>) {
  return <AppShell role="candidate">{children}</AppShell>;
}
