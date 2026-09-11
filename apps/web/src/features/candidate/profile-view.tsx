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
import { Textarea } from '@hiresense/ui/components/textarea';
import { toast } from '@hiresense/ui/components/toast';
import { PageHeader } from '@/components/page/page-header';
import type { CandidateProfile } from '@/features/candidate/types';
import { ApiError, apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

type ProfileForm = {
  fullName: string;
  phone: string;
  headline: string;
  summary: string;
  city: string;
  region: string;
  countryCode: string;
  experienceMonthsDeclared: string;
};

const emptyForm: ProfileForm = {
  fullName: '',
  phone: '',
  headline: '',
  summary: '',
  city: '',
  region: '',
  countryCode: '',
  experienceMonthsDeclared: '',
};

function toForm(profile: CandidateProfile): ProfileForm {
  return {
    fullName: profile.fullName,
    phone: profile.phone ?? '',
    headline: profile.headline ?? '',
    summary: profile.summary ?? '',
    city: profile.city ?? '',
    region: profile.region ?? '',
    countryCode: profile.countryCode ?? '',
    experienceMonthsDeclared:
      profile.experienceMonthsDeclared == null ? '' : String(profile.experienceMonthsDeclared),
  };
}

export function ProfileView() {
  const router = useRouter();
  const [exists, setExists] = useState(false);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getAuthSession();
    if (!session || !hasRole(session, 'CANDIDATE')) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const profile = await apiRequest<CandidateProfile>('/api/candidates/me');
        if (cancelled) return;
        setExists(true);
        setForm(toForm(profile));
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
    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim() || null,
      headline: form.headline.trim() || null,
      summary: form.summary.trim() || null,
      city: form.city.trim() || null,
      region: form.region.trim() || null,
      countryCode: form.countryCode.trim().toUpperCase() || null,
      experienceMonthsDeclared:
        form.experienceMonthsDeclared.trim() === '' ? null : Number(form.experienceMonthsDeclared),
    };
    try {
      const profile = await apiRequest<CandidateProfile>('/api/candidates/me', {
        method: exists ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      setExists(true);
      setForm(toForm(profile));
      toast.add({
        type: 'success',
        title: 'Profile saved',
        description: 'Your candidate profile is up to date.',
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <Skeleton className="h-16 w-80" />
        <Skeleton className="h-[420px]" />
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        title="Profile"
        description={
          exists
            ? 'Keep your candidate information current for applications and recruiter review.'
            : 'Create your candidate profile before applying for jobs.'
        }
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
            <CardTitle>Candidate information</CardTitle>
            <CardDescription>
              Basic contact, location, and professional context used throughout HireSense.
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
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, fullName: event.target.value }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phone: event.target.value }))
                    }
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="headline">Professional headline</FieldLabel>
                <Input
                  id="headline"
                  placeholder="Full Stack Developer"
                  value={form.headline}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, headline: event.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="summary">Summary</FieldLabel>
                <Textarea
                  id="summary"
                  rows={6}
                  placeholder="Briefly describe your experience and focus."
                  value={form.summary}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, summary: event.target.value }))
                  }
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="city">City</FieldLabel>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, city: event.target.value }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="region">Region</FieldLabel>
                  <Input
                    id="region"
                    value={form.region}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, region: event.target.value }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="countryCode">Country code</FieldLabel>
                  <Input
                    id="countryCode"
                    maxLength={2}
                    placeholder="VN"
                    value={form.countryCode}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, countryCode: event.target.value }))
                    }
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="experienceMonthsDeclared">
                  Declared experience (months)
                </FieldLabel>
                <Input
                  id="experienceMonthsDeclared"
                  type="number"
                  min={0}
                  value={form.experienceMonthsDeclared}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      experienceMonthsDeclared: event.target.value,
                    }))
                  }
                  className="max-w-48"
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
