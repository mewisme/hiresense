import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { ApiError, apiRequest } from '@/lib/api';
import type {
  AuthUser,
  CandidateApplicationListItem,
  CompanyMembershipListItem,
  ManagedJobListItem,
  RecruiterApplicationListResponse,
} from '@/lib/api-types';

export default async function WorkspacePage() {
  let user: AuthUser;
  try {
    user = await apiRequest<AuthUser>('/auth/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/login');
    throw error;
  }

  if (user.roles.includes('CANDIDATE')) return <CandidateWorkspace email={user.email} />;
  if (user.roles.includes('RECRUITER')) return <RecruiterWorkspace email={user.email} />;

  return (
    <PageShell eyebrow="Workspace" title="No recruitment workspace available" subtitle={user.email}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        This account does not currently have Candidate or Recruiter access.
      </div>
    </PageShell>
  );
}

async function CandidateWorkspace({ email }: { email: string }) {
  const applications = await apiRequest<CandidateApplicationListItem[]>(
    '/candidates/me/applications',
  );
  return (
    <PageShell
      eyebrow="Candidate workspace"
      title="Your applications"
      subtitle={`Signed in as ${email}`}
    >
      {applications.length === 0 ? (
        <EmptyWorkspace text="You have not applied to any jobs yet." />
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => (
            <Link
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
              href={`/candidate/applications/${application.id}/match`}
              key={application.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-emerald-700">
                    {application.job.company.name}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950 group-hover:text-emerald-800">
                    {application.jobVersion.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Applied {formatDate(application.appliedAt)}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {application.currentStage.name}
                </span>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-700">View match result →</p>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}

async function RecruiterWorkspace({ email }: { email: string }) {
  const memberships = await apiRequest<CompanyMembershipListItem[]>('/companies/me');
  const companies = await Promise.all(
    memberships.map(async (membership) => {
      const jobs = await apiRequest<ManagedJobListItem[]>(
        `/companies/${membership.companyId}/jobs`,
      );
      const applicantGroups = await Promise.all(
        jobs.map(async (job) => ({
          job,
          applicants: await apiRequest<RecruiterApplicationListResponse>(
            `/companies/${membership.companyId}/jobs/${job.id}/applications?limit=50`,
          ),
        })),
      );
      return { membership, applicantGroups };
    }),
  );

  return (
    <PageShell
      eyebrow="Recruiter workspace"
      title="Applicant review"
      subtitle={`Signed in as ${email}`}
    >
      {companies.length === 0 ? (
        <EmptyWorkspace text="You are not an active member of a company yet." />
      ) : (
        <div className="space-y-8">
          {companies.map(({ membership, applicantGroups }) => (
            <section key={membership.id}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">{membership.role}</p>
                  <h2 className="text-xl font-semibold text-slate-950">
                    {membership.company.name}
                  </h2>
                </div>
              </div>
              <div className="space-y-4">
                {applicantGroups.map(({ job, applicants }) => {
                  const version = job.currentPublishedVersion ?? job.currentDraftVersion;
                  return (
                    <div
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      key={job.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-950">
                            {version?.title ?? 'Untitled job'}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {applicants.pagination.total} applicant
                            {applicants.pagination.total === 1 ? '' : 's'} ·{' '}
                            {job.status.toLowerCase()}
                          </p>
                        </div>
                      </div>
                      {applicants.items.length === 0 ? (
                        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                          No applications for this job.
                        </p>
                      ) : (
                        <div className="mt-4 divide-y divide-slate-100">
                          {applicants.items.map((application) => (
                            <Link
                              className="flex items-center justify-between gap-4 py-3 text-sm hover:text-emerald-800"
                              href={`/recruiter/companies/${membership.companyId}/applications/${application.id}`}
                              key={application.id}
                            >
                              <div>
                                <p className="font-medium text-slate-900">
                                  {application.candidate.fullName}
                                </p>
                                <p className="mt-0.5 text-slate-500">
                                  {application.candidate.headline ?? 'Applicant'} ·{' '}
                                  {formatDate(application.appliedAt)}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {application.currentStage.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function EmptyWorkspace({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
      {text}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}
