export interface ExtractResumeEducationsInput {
  text: string;
}

export interface ExtractedResumeEducation {
  institutionName: string | null;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  ordinal: number;
  confidence: number;
}

export interface ExtractResumeEducationsResponse {
  educations: ExtractedResumeEducation[];
  warnings: string[];
}