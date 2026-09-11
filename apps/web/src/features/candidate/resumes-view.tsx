'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@hiresense/ui/components/alert';
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@hiresense/ui/components/attachment';
import { Badge } from '@hiresense/ui/components/badge';
import { Button } from '@hiresense/ui/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@hiresense/ui/components/field';
import { Input } from '@hiresense/ui/components/input';
import { Skeleton } from '@hiresense/ui/components/skeleton';
import { Spinner } from '@hiresense/ui/components/spinner';
import { toast } from '@hiresense/ui/components/toast';
import { PageHeader } from '@/components/page/page-header';
import type { ResumeListItem } from '@/features/candidate/types';
import { apiRequest, apiUpload, getAuthSession, hasRole } from '@/lib/api-client';

export function ResumesView() {
  const router = useRouter();
  const [items, setItems] = useState<ResumeListItem[]>([]);
  const [name, setName] = useState('Primary CV');
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setItems(await apiRequest<ResumeListItem[]>('/api/resumes'));
  }

  useEffect(() => {
    const session = getAuthSession();
    if (!session || !hasRole(session, 'CANDIDATE')) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        await reload();
      } catch (loadError) {
        if (!cancelled)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load resumes.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError('Choose a PDF file to upload.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set('name', name.trim() || 'Resume');
      formData.set('file', file);
      const created = await apiUpload<{
        id: string;
        currentVersionId: string | null;
        version: { id: string };
      }>('/api/resumes', formData);
      if (created.version?.id) {
        setParsing(true);
        await apiRequest(`/api/resumes/${created.id}/versions/${created.version.id}/parse-runs`, {
          method: 'POST',
        });
      }
      setFile(null);
      setFileInputKey((value) => value + 1);
      await reload();
      toast.add({
        type: 'success',
        title: 'Resume ready',
        description: created.version?.id
          ? 'The PDF was uploaded and parsed successfully.'
          : 'The resume was uploaded successfully.',
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload resume.');
    } finally {
      setUploading(false);
      setParsing(false);
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
        title="Resumes"
        description="Manage independent resumes and the current PDF version used for applications and baseline matching."
      />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Resume action failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid items-start gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={(event) => void upload(event)}>
          <Card>
            <CardHeader>
              <CardTitle>Upload resume</CardTitle>
              <CardDescription>
                Add a PDF and run structured parsing for skills, experience, and education.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="resumeName">Resume name</FieldLabel>
                  <Input
                    id="resumeName"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="resumeFile">PDF file</FieldLabel>
                  <Input
                    key={fileInputKey}
                    id="resumeFile"
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  />
                  <FieldDescription>
                    {file ? file.name : 'Select a text-based PDF accepted by the HireSense parser.'}
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="justify-end border-t">
              <Button type="submit" disabled={uploading}>
                {uploading ? (
                  <>
                    <Spinner />
                    {parsing ? 'Parsing' : 'Uploading'}
                  </>
                ) : (
                  <>
                    <Upload />
                    Upload resume
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
        <div className="space-y-3">
          {items.length === 0 ? (
            <Empty className="min-h-64 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle>No resumes yet</EmptyTitle>
                <EmptyDescription>
                  Upload your first PDF to make it available for job applications.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent />
            </Empty>
          ) : (
            items.map((resume) => (
              <Card key={resume.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    {resume.name}
                  </CardTitle>
                  <CardDescription>
                    {resume.currentVersion
                      ? `Current v${resume.currentVersion.versionNo} · ${resume.currentVersion.file.originalFilename}`
                      : 'No current version'}
                  </CardDescription>
                  <CardAction>
                    {resume.isDefault ? (
                      <Badge variant="secondary">Default</Badge>
                    ) : (
                      <Badge variant="outline">Resume</Badge>
                    )}
                  </CardAction>
                </CardHeader>
                {resume.currentVersion ? (
                  <CardContent>
                    <Attachment className="w-full">
                      <AttachmentMedia>
                        <FileText />
                      </AttachmentMedia>
                      <AttachmentContent>
                        <AttachmentTitle>
                          {resume.currentVersion.file.originalFilename}
                        </AttachmentTitle>
                        <AttachmentDescription>
                          v{resume.currentVersion.versionNo} ·{' '}
                          {Number(resume.currentVersion.file.sizeBytes).toLocaleString()} bytes ·
                          uploaded{' '}
                          {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
                            new Date(resume.currentVersion.createdAt),
                          )}
                        </AttachmentDescription>
                      </AttachmentContent>
                    </Attachment>
                  </CardContent>
                ) : null}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
