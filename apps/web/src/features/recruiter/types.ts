export interface RecruiterProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  jobTitle: string | null;
}

export interface CompanyMembershipItem {
  id: string;
  role: string;
  status: string;
  company: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    websiteUrl: string | null;
    status: string;
  };
}

export interface ManagedJobListItem {
  id: string;
  slug: string;
  status: string;
  currentPublishedVersionId: string | null;
  currentDraftVersion: {
    id: string;
    versionNo: number;
    versionStatus: string;
    title: string;
    summary: string | null;
  } | null;
  currentPublishedVersion: {
    id: string;
    versionNo: number;
    versionStatus: string;
    title: string;
    summary: string | null;
  } | null;
}

export interface SkillOption {
  id: string;
  name: string;
  normalizedName: string;
}

export interface RecruitmentStageOption {
  id: string;
  code: string;
  name: string;
  ordinal: number;
  isTerminal: boolean;
  terminalOutcome: string | null;
}

export interface RecruiterApplicationListItem {
  id: string;
  jobId: string;
  appliedAt: string;
  withdrawnAt: string | null;
  currentStage: { id: string; code: string; name: string };
  candidate: {
    id: string;
    fullName: string;
    headline: string | null;
    city: string | null;
    experienceMonthsDeclared: number | null;
  };
  jobVersion: { id: string; versionNo: number; title: string };
  resumeVersion: {
    id: string;
    versionNo: number;
    resume: { id: string; name: string };
  };
}
