'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@hiresense/ui/components/alert';
import { Badge } from '@hiresense/ui/components/badge';
import { Button } from '@hiresense/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@hiresense/ui/components/card';
import { Checkbox } from '@hiresense/ui/components/checkbox';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@hiresense/ui/components/field';
import { Input } from '@hiresense/ui/components/input';
import { ScrollArea } from '@hiresense/ui/components/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@hiresense/ui/components/select';
import { Skeleton } from '@hiresense/ui/components/skeleton';
import { Spinner } from '@hiresense/ui/components/spinner';
import { Textarea } from '@hiresense/ui/components/textarea';
import { toast } from '@hiresense/ui/components/toast';
import { PageHeader } from '@/components/page/page-header';
import type { SkillOption } from '@/features/recruiter/types';
import { apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

const educationOptions = [
  { value: 'NOT_REQUIRED', label: 'Not required' },
  { value: 'HIGH_SCHOOL', label: 'High school' },
  { value: 'ASSOCIATE', label: 'Associate' },
  { value: 'BACHELOR', label: 'Bachelor' },
  { value: 'MASTER', label: 'Master' },
  { value: 'DOCTORATE', label: 'Doctorate' },
];

export function JobCreateView({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [experienceMinMonths, setExperienceMinMonths] = useState('12');
  const [educationMinDegree, setEducationMinDegree] = useState('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getAuthSession();
    if (!session || !hasRole(session, 'RECRUITER')) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const next = await apiRequest<SkillOption[]>('/api/skills');
        if (!cancelled) setSkills(next);
      } catch (loadError) {
        if (!cancelled)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load skills.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function toggleSkill(skillId: string) {
    setSelectedSkillIds((current) =>
      current.includes(skillId) ? current.filter((id) => id !== skillId) : [...current, skillId],
    );
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (selectedSkillIds.length === 0) {
      setError('Select at least one skill requirement.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await apiRequest<{ id: string }>(`/api/companies/${companyId}/jobs`, {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          experienceMinMonths: experienceMinMonths.trim() ? Number(experienceMinMonths) : null,
          educationMinDegree: educationMinDegree || null,
          skills: selectedSkillIds.map((skillId) => ({
            skillId,
            isRequired: true,
            importance: 3,
            weight: '1',
          })),
        }),
      });
      toast.add({
        type: 'success',
        title: 'Draft created',
        description: 'Review the job details before publishing.',
      });
      router.push(`/recruiter/companies/${companyId}/jobs/${result.id}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to create job.');
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <Skeleton className="h-16 w-80" />
        <Skeleton className="h-[560px]" />
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Create job"
        description="Create a draft with structured skills, experience, and education requirements used by baseline matching."
      />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to create job</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <form onSubmit={(event) => void create(event)}>
        <Card>
          <CardHeader>
            <CardTitle>Job details</CardTitle>
            <CardDescription>
              All selected skills are required in the current V1 create flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input
                  id="title"
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  required
                  rows={8}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="experienceMinMonths">Minimum experience (months)</FieldLabel>
                  <Input
                    id="experienceMinMonths"
                    type="number"
                    min={0}
                    value={experienceMinMonths}
                    onChange={(event) => setExperienceMinMonths(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="educationMinDegree">Minimum education</FieldLabel>
                  <Select
                    value={educationMinDegree || 'NOT_REQUIRED'}
                    onValueChange={(value) => {
                      if (value != null)
                        setEducationMinDegree(value === 'NOT_REQUIRED' ? '' : value);
                    }}
                  >
                    <SelectTrigger id="educationMinDegree" className="w-full">
                      <SelectValue>
                        {(value) =>
                          educationOptions.find((option) => option.value === value)?.label ??
                          'Not required'
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {educationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel>Required skills</FieldLabel>
                  <Badge variant="secondary">{selectedSkillIds.length} selected</Badge>
                </div>
                <FieldDescription>
                  Select at least one canonical skill. These requirements feed deterministic V1
                  matching.
                </FieldDescription>
                <ScrollArea className="h-72 rounded-lg border">
                  <div className="grid gap-1 p-2 md:grid-cols-2">
                    {skills.map((skill) => {
                      const selected = selectedSkillIds.includes(skill.id);
                      return (
                        <label
                          key={skill.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-muted"
                        >
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => toggleSkill(skill.id)}
                          />
                          <span>{skill.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </ScrollArea>
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end border-t">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Spinner />
                  Creating
                </>
              ) : (
                'Create draft job'
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
