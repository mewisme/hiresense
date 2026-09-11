export interface CandidateProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  headline: string | null;
  summary: string | null;
  city: string | null;
  region: string | null;
  countryCode: string | null;
  timezone: string;
  experienceMonthsDeclared: number | null;
  portfolioUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
}

export interface PublicJobListItem {
  id: string;
  slug: string;
  status: string;
  firstPublishedAt: string | null;
  company: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    websiteUrl: string | null;
  };
  version: {
    id: string;
    versionNo: number;
    title: string;
    summary: string | null;
    description: string;
    employmentType: string | null;
    workplaceType: string | null;
    experienceMinMonths: number | null;
    experienceMaxMonths: number | null;
    educationMinDegree: string | null;
    salaryMin: string | null;
    salaryMax: string | null;
    salaryCurrency: string | null;
    publishedAt: string | null;
    skills: Array<{
      skillId: string;
      name: string;
      importance: number;
      isRequired: boolean;
      weight: string;
      minExperienceMonths: number | null;
    }>;
  };
}

export interface CandidateApplicationListItem {
  id: string;
  jobId: string;
  appliedAt: string;
  withdrawnAt: string | null;
  currentStage: { id: string; code: string; name: string };
  job: { id: string; slug: string; status: string; company: { id: string; name: string } };
  jobVersion: {
    id: string;
    title: string;
    summary: string | null;
    employmentType: string | null;
    workplaceType: string | null;
  };
}

export interface ResumeListItem {
  id: string;
  name: string;
  isDefault: boolean;
  currentVersionId: string | null;
  currentVersion: {
    id: string;
    versionNo: number;
    createdAt: string;
    file: { originalFilename: string; sizeBytes: string };
  } | null;
  createdAt: string;
  updatedAt: string;
}
