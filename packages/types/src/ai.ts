export interface MatchScoreBreakdown {
  skills: number;
  experience: number;
  education: number;
  semantic?: number;
}

export interface MatchResult {
  overallScore: number;
  breakdown: MatchScoreBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
  version: string;
}

export type MatchRunStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
export type MatchSkillStatus = 'MATCHED' | 'PARTIAL' | 'MISSING';

export interface ApplicationMatchRunResponse {
  id: string;
  applicationId: string;
  resumeParseRunId: string;
  jobVersionId: string;
  pipelineVersionId: string;
  status: MatchRunStatus;
  overallScore: number | null;
  startedAt: string | null;
  completedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  pipeline: {
    id: string;
    code: string;
    pipelineType: string;
    semanticVersion: string;
    codeRevision: string | null;
  };
  resumeParseRun: {
    id: string;
    pipelineVersionId: string;
    status: string;
    detectedLanguage: string | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
  };
  components: Array<{
    id: string;
    code: string;
    rawScore: number;
    weight: number;
    weightedScore: number;
    details: unknown;
  }>;
  skills: Array<{
    id: string;
    status: MatchSkillStatus;
    similarityScore: number | null;
    evidenceText: string | null;
    requirement: {
      jobVersionSkillId: string;
      skillId: string;
      name: string;
      normalizedName: string;
      importance: string;
      isRequired: boolean;
      weight: string;
      minExperienceMonths: number | null;
    };
    resumeSkill: {
      id: string;
      skillId: string;
      name: string;
      normalizedName: string;
      confidence: string | null;
    } | null;
  }>;
}
