import { Badge } from '@hiresense/ui/components/badge';
import { cn } from '@hiresense/ui/lib/utils';

const tones: Record<string, string> = {
  MATCHED: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  SUCCEEDED: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  HIRED: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  PARTIAL: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  MISSING: 'border-destructive/20 bg-destructive/10 text-destructive',
  FAILED: 'border-destructive/20 bg-destructive/10 text-destructive',
  REJECTED: 'border-destructive/20 bg-destructive/10 text-destructive',
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(tones[status.toUpperCase()], className)}>
      {label ?? status}
    </Badge>
  );
}
