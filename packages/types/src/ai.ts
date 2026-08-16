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
