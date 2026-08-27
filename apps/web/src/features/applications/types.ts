export interface RecruitmentStage {
  id: string;
  code: string;
  name: string;
  ordinal: number;
  isTerminal: boolean;
  terminalOutcome: string | null;
}

export interface CandidateApplicationDetail {
  id: string;
  jobId: string;
  jobVersionId: string;
  resumeVersionId: string;
  coverLetter: string | null;
  appliedAt: string;
  withdrawnAt: string | null;
  currentStage: RecruitmentStage;
  job: {
    id: string;
    slug: string;
    status: string;
    company: { id: string; name: string; slug: string; description: string | null; websiteUrl: string | null };
  };
  jobVersion: {
    id: string;
    versionNo: number;
    title: string;
    summary: string | null;
    employmentType: string;
    workplaceType: string;
  };
  resumeVersion: { id: string; versionNo: number; resume: { id: string; name: string } };
}

export interface RecruiterApplicationDetail {
  id: string;
  jobId: string;
  jobVersionId: string;
  resumeVersionId: string;
  coverLetter: string | null;
  appliedAt: string;
  withdrawnAt: string | null;
  currentStage: RecruitmentStage;
  candidate: {
    id: string;
    fullName: string;
    phone: string | null;
    headline: string | null;
    summary: string | null;
    city: string | null;
    region: string | null;
    countryCode: string | null;
    experienceMonthsDeclared: number | null;
    portfolioUrl: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
  };
  company: { id: string; name: string; slug: string };
  job: { id: string; slug: string; status: string };
  jobVersion: {
    id: string;
    versionNo: number;
    title: string;
    summary: string | null;
    employmentType: string;
    workplaceType: string;
  };
  resumeVersion: { id: string; versionNo: number; resume: { id: string; name: string } };
}
