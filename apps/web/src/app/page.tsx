import Link from 'next/link';
import { BrainCircuit, BriefcaseBusiness, FileSearch, ShieldCheck } from 'lucide-react';
import { Badge } from '@hiresense/ui/components/badge';
import { Button } from '@hiresense/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@hiresense/ui/components/card';

const features = [
  {
    icon: FileSearch,
    title: 'Structured CV analysis',
    description: 'Extract skills, experience, and education into versioned resume data.',
  },
  {
    icon: BrainCircuit,
    title: 'Explainable matching',
    description: 'Review deterministic component scores, requirements, and CV evidence.',
  },
  {
    icon: ShieldCheck,
    title: 'Human-in-the-loop',
    description:
      'Match scores support recruiter review and never make hiring decisions automatically.',
  },
];

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BriefcaseBusiness className="size-4" />
            </span>
            HireSense
          </Link>
          <Button render={<Link href="/login" />}>Sign in</Button>
        </div>
      </header>
      <section className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div>
          <Badge variant="outline">AI-assisted recruitment</Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-balance lg:text-6xl">
            Explainable CV–job matching for better recruitment review.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
            HireSense turns resumes and job requirements into structured, versioned analysis so
            candidates and recruiters can understand where a profile matches and where evidence is
            missing.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" render={<Link href="/login" />}>
              Open HireSense
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/candidate/jobs" />}>
              Browse jobs
            </Button>
          </div>
        </div>
        <div className="grid gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardHeader className="grid grid-cols-[auto_1fr] gap-x-4">
                  <div className="row-span-2 flex size-9 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="sr-only">{feature.description}</CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
