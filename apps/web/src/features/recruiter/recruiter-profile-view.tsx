'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@hiresense/ui/components/alert';
import { Button } from '@hiresense/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@hiresense/ui/components/card';
import { Field, FieldGroup, FieldLabel } from '@hiresense/ui/components/field';
import { Input } from '@hiresense/ui/components/input';
import { Skeleton } from '@hiresense/ui/components/skeleton';
import { Spinner } from '@hiresense/ui/components/spinner';
import { toast } from '@hiresense/ui/components/toast';
import { PageHeader } from '@/components/page/page-header';
import type { RecruiterProfile } from '@/features/recruiter/types';
import { ApiError, apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

export function RecruiterProfileView() {
  const router = useRouter();
  const [exists, setExists] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
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
        const profile = await apiRequest<RecruiterProfile>('/api/recruiters/me');
        if (cancelled) return;
        setExists(true);
        setFullName(profile.fullName);
        setPhone(profile.phone ?? '');
        setJobTitle(profile.jobTitle ?? '');
      } catch (loadError) {
        if (cancelled) return;
        if (loadError instanceof ApiError && loadError.status === 404) setExists(false);
        else setError(loadError instanceof Error ? loadError.message : 'Unable to load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const profile = await apiRequest<RecruiterProfile>('/api/recruiters/me', {
        method: exists ? 'PATCH' : 'POST',
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim() || null,
          jobTitle: jobTitle.trim() || null,
        }),
      });
      setExists(true);
      setFullName(profile.fullName);
      setPhone(profile.phone ?? '');
      setJobTitle(profile.jobTitle ?? '');
      toast.add({
        type: 'success',
        title: 'Profile saved',
        description: 'Your recruiter profile is up to date.',
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Skeleton className="h-16 w-80" />
        <Skeleton className="h-72" />
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title="Recruiter profile"
        description="Keep the identity used for company and recruitment workflows up to date."
      />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to save profile</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <form onSubmit={(event) => void save(event)}>
        <Card>
          <CardHeader>
            <CardTitle>Profile information</CardTitle>
            <CardDescription>
              This information identifies you inside company workspaces.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                  <Input
                    id="fullName"
                    required
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="jobTitle">Job title</FieldLabel>
                  <Input
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(event) => setJobTitle(event.target.value)}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="max-w-sm"
                />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end border-t">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Spinner />
                  Saving
                </>
              ) : exists ? (
                'Save changes'
              ) : (
                'Create profile'
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
