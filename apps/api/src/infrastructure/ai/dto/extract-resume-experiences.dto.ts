export interface ExtractResumeExperiencesInput {
  text: string;
  referenceDate: string;
}

export interface ExtractedResumeExperience {
  companyName: string | null;
  jobTitle: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  experienceMonths: number;
  ordinal: number;
  confidence: number;
}

export interface ExtractResumeExperiencesResponse {
  experiences: ExtractedResumeExperience[];
  warnings: string[];
}