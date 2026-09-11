import type { ApplicationMatchRunResponse } from '@hiresense/types';
import { BrainCircuit, Info, Play } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@hiresense/ui/components/alert';
import { Badge } from '@hiresense/ui/components/badge';
import { Button } from '@hiresense/ui/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@hiresense/ui/components/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@hiresense/ui/components/empty';
import { Progress } from '@hiresense/ui/components/progress';
import { Skeleton } from '@hiresense/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@hiresense/ui/components/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@hiresense/ui/components/tooltip';
import { StatusBadge } from '@/components/page/status-badge';

interface MatchResultPanelProps {
  result: ApplicationMatchRunResponse;
  audience: 'candidate' | 'recruiter';
}

const componentLabels: Record<string, string> = {
  SKILL: 'Skills',
  EXPERIENCE: 'Experience',
  EDUCATION: 'Education',
};

function formatScore(value: number | null) {
  return value == null ? '—' : value.toFixed(1);
}
function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(value),
      )
    : '—';
}

export function MatchResultPanel({ result, audience }: MatchResultPanelProps) {
  const matched = result.skills.filter((skill) => skill.status === 'MATCHED').length;
  const partial = result.skills.filter((skill) => skill.status === 'PARTIAL').length;
  const missing = result.skills.filter((skill) => skill.status === 'MISSING').length;

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardDescription>Overall match</CardDescription>
            <CardTitle className="flex items-end gap-1 text-5xl tabular-nums">
              {formatScore(result.overallScore)}
              <span className="pb-1 text-sm font-normal text-muted-foreground">/100</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info />
              <AlertTitle>
                {audience === 'recruiter' ? 'Review signal only' : 'How to read this score'}
              </AlertTitle>
              <AlertDescription>
                {audience === 'recruiter'
                  ? 'Use this result as supporting evidence. HireSense does not automatically hire or reject candidates.'
                  : 'This score summarizes how the submitted CV matches the structured job requirements.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Score breakdown</CardTitle>
            <CardDescription>
              Deterministic V1 components and their configured contribution.
            </CardDescription>
            <CardAction>
              <Badge variant="outline">
                {result.pipeline.code} · v{result.pipeline.semanticVersion}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            {result.components.map((component) => (
              <div key={component.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    {componentLabels[component.code] ?? component.code}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatScore(component.rawScore)}
                  </span>
                </div>
                <Progress value={Math.max(0, Math.min(100, component.rawScore))} />
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Weight {(component.weight * 100).toFixed(0)}%</span>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <span className="cursor-help underline decoration-dotted underline-offset-4" />
                      }
                    >
                      Contribution {formatScore(component.weightedScore)}
                    </TooltipTrigger>
                    <TooltipContent>Weighted contribution to the overall score</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
            {result.components.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No component breakdown was recorded for this run.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requirement evidence</CardTitle>
          <CardDescription>
            Canonical job skills compared with normalized evidence from the submitted resume.
          </CardDescription>
          <div className="mt-2 flex gap-2">
            <StatusBadge status="MATCHED" label={`${matched} matched`} />
            <StatusBadge status="PARTIAL" label={`${partial} partial`} />
            <StatusBadge status="MISSING" label={`${missing} missing`} />
          </div>
        </CardHeader>
        <CardContent>
          {result.skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No skill requirements were recorded for this analysis.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>CV evidence</TableHead>
                    <TableHead className="text-right">Metadata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.skills.map((skill) => (
                    <TableRow key={skill.id}>
                      <TableCell className="font-medium">{skill.requirement.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={skill.status} label={skill.status.toLowerCase()} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {skill.requirement.isRequired ? 'Required' : 'Preferred'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-lg whitespace-normal text-muted-foreground">
                        {skill.resumeSkill ? (
                          <>
                            <span className="font-medium text-foreground">
                              {skill.resumeSkill.name}
                            </span>
                            {skill.evidenceText ? ` — ${skill.evidenceText}` : ''}
                          </>
                        ) : (
                          'No normalized matching skill was found in the submitted CV.'
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {skill.requirement.minExperienceMonths != null
                          ? `${skill.requirement.minExperienceMonths} mo min`
                          : '—'}
                        {skill.similarityScore != null
                          ? ` · ${(skill.similarityScore * 100).toFixed(0)}% similarity`
                          : ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Run status</CardDescription>
            <CardTitle>
              <StatusBadge status={result.status} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Completed</CardDescription>
            <CardTitle>{formatDate(result.completedAt)}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Resume language</CardDescription>
            <CardTitle>{result.resumeParseRun.detectedLanguage ?? 'Not detected'}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </section>
  );
}

export function MatchResultLoading() {
  return (
    <div className="space-y-6" aria-label="Loading analysis result">
      <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
      <Skeleton className="h-80" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    </div>
  );
}

export function MatchResultEmpty({
  recruiter = false,
  onRun,
}: {
  recruiter?: boolean;
  onRun?: () => void;
}) {
  return (
    <Empty className="min-h-72 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BrainCircuit />
        </EmptyMedia>
        <EmptyTitle>No analysis result yet</EmptyTitle>
        <EmptyDescription>
          {recruiter
            ? 'Run the deterministic baseline analysis to create a reproducible score, component breakdown, and requirement evidence. Matching does not run automatically on apply.'
            : 'Matching is recruiter-triggered in V1. Your score appears here after a recruiter runs the baseline analysis.'}
        </EmptyDescription>
      </EmptyHeader>
      {recruiter && onRun ? (
        <EmptyContent>
          <Button onClick={onRun}>
            <Play />
            Run analysis
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

export function MatchResultError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Unable to load analysis</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>{message}</span>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
