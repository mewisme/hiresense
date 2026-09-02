export interface ApplicationStageSummary {
  id: string;
  code: string;
  name: string;
  ordinal: number;
  isTerminal: boolean;
  terminalOutcome: string | null;
}

export interface CandidateApplicationDetail {
  id: string;
  appliedAt: string;
  withdrawnAt: string | null;
  currentStage: ApplicationStageSummary;
  job: {
    id: string;
    slug: string;
    status: string;
    company: { id: string; name: string; slug: string };
  };
  jobVersion: {
    id: string;
    versionNo: number;
    title: string;
    summary: string | null;
  };
  resumeVersion: {
    id: string;
    versionNo: number;
    resume: { id: string; name: string };
  };
}

export interface CandidateApplicationListItem {
  id: string;
  appliedAt: string;
  withdrawnAt: string | null;
  currentStage: ApplicationStageSummary;
  job: {
    id: string;
    slug: string;
    status: string;
    company: { id: string; name: string; slug: string };
  };
  jobVersion: {
    id: string;
    versionNo: number;
    title: string;
    summary: string | null;
    employmentType: string | null;
    workplaceType: string | null;
  };
}

export interface RecruiterApplicationDetail {
  id: string;
  appliedAt: string;
  withdrawnAt: string | null;
  currentStage: ApplicationStageSummary;
  candidate: {
    id: string;
    fullName: string;
    headline: string | null;
    city: string | null;
    region: string | null;
    countryCode: string | null;
  };
  company: { id: string; name: string; slug: string };
  job: { id: string; slug: string; status: string };
  jobVersion: {
    id: string;
    versionNo: number;
    title: string;
    summary: string | null;
  };
  resumeVersion: {
    id: string;
    versionNo: number;
    resume: { id: string; name: string };
  };
}

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

export interface CompanyMembershipListItem {
  id: string;
  companyId: string;
  role: string;
  status: string;
  company: { id: string; name: string; slug: string };
}

export interface ManagedJobListItem {
  id: string;
  status: string;
  currentDraftVersion: { id: string; title: string; versionNo: number } | null;
  currentPublishedVersion: { id: string; title: string; versionNo: number } | null;
}

export interface RecruiterApplicationListItem {
  id: string;
  appliedAt: string;
  currentStage: ApplicationStageSummary;
  candidate: { id: string; fullName: string; headline: string | null };
  jobVersion: { id: string; versionNo: number; title: string };
}

export interface RecruiterApplicationListResponse {
  items: RecruiterApplicationListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
