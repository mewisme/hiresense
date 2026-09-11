'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@hiresense/ui/components/empty';
import { Field, FieldGroup, FieldLabel } from '@hiresense/ui/components/field';
import { Input } from '@hiresense/ui/components/input';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@hiresense/ui/components/item';
import { Skeleton } from '@hiresense/ui/components/skeleton';
import { Spinner } from '@hiresense/ui/components/spinner';
import { Textarea } from '@hiresense/ui/components/textarea';
import { toast } from '@hiresense/ui/components/toast';
import { PageHeader } from '@/components/page/page-header';
import type { CompanyMembershipItem } from '@/features/recruiter/types';
import { apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

export function CompaniesView() {
  const router = useRouter();
  const [items, setItems] = useState<CompanyMembershipItem[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setItems(await apiRequest<CompanyMembershipItem[]>('/api/companies/me'));
  }

  useEffect(() => {
    const session = getAuthSession();
    if (!session || !hasRole(session, 'RECRUITER')) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        await reload();
      } catch (loadError) {
        if (!cancelled)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load companies.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function createCompany(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const company = await apiRequest<{ id: string }>('/api/companies', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });
      setName('');
      setDescription('');
      await reload();
      toast.add({
        type: 'success',
        title: 'Company created',
        description: 'The company workspace is ready.',
      });
      router.push(`/recruiter/companies/${company.id}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to create company.');
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-80" />
        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Create a company workspace or open one where you have an active membership."
      />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Company action failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid items-start gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={(event) => void createCompany(event)}>
          <Card>
            <CardHeader>
              <CardTitle>Create company</CardTitle>
              <CardDescription>Start a workspace for jobs and applicant review.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="companyName">Company name</FieldLabel>
                  <Input
                    id="companyName"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="companyDescription">Description</FieldLabel>
                  <Textarea
                    id="companyDescription"
                    rows={4}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
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
                  'Create company'
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
        {items.length === 0 ? (
          <Empty className="min-h-64 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2 />
              </EmptyMedia>
              <EmptyTitle>No companies yet</EmptyTitle>
              <EmptyDescription>
                Create your first company workspace to begin publishing jobs.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="gap-2">
            {items.map((item) => (
              <Item
                key={item.id}
                variant="outline"
                render={<Link href={`/recruiter/companies/${item.company.id}`} />}
                className="p-4"
              >
                <ItemContent>
                  <ItemTitle className="text-base">{item.company.name}</ItemTitle>
                  <ItemDescription>{item.company.description ?? item.company.slug}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge variant="outline">{item.role}</Badge>
                  <Badge variant="secondary">{item.status}</Badge>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </div>
    </div>
  );
}
