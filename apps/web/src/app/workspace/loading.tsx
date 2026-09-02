import { PageShell } from '@/components/page-shell';

export default function Loading() {
  return (
    <PageShell eyebrow="Workspace" title="Loading your workspace">
      <div className="space-y-4 animate-pulse">
        {[0, 1, 2].map((item) => (
          <div className="h-32 rounded-2xl bg-slate-200" key={item} />
        ))}
      </div>
    </PageShell>
  );
}
