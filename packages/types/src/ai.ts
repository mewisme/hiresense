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

export interface MatchRunPipeline {
  id: string;
  code: string;
  pipelineType: string;
  semanticVersion: string;
  codeRevision: string | null;
}

export interface MatchRunResumeParse {
  id: string;
  pipelineVersionId: string;
  status: string;
  detectedLanguage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface MatchRunComponent {
  id: string;
  code: string;
  rawScore: number;
  weight: number;
  weightedScore: number;
  details: Record<string, unknown> | null;
}

export interface MatchSkillRequirement {
  jobVersionSkillId: string;
  skillId: string;
  name: string;
  normalizedName: string;
  importance: number;
  isRequired: boolean;
  weight: string;
  minExperienceMonths: number | null;
}

export interface MatchResumeSkill {
  id: string;
  skillId: string;
  name: string;
  normalizedName: string;
  confidence: string | null;
}

export interface MatchRunSkillResult {
  id: string;
  status: MatchSkillStatus;
  similarityScore: number | null;
  evidenceText: string | null;
  requirement: MatchSkillRequirement;
  resumeSkill: MatchResumeSkill | null;
}

export interface ApplicationMatchRun {
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
  pipeline: MatchRunPipeline;
  resumeParseRun: MatchRunResumeParse;
  components: MatchRunComponent[];
  skills: MatchRunSkillResult[];
}
