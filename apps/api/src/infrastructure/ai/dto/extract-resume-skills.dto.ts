export interface ResumeSkillDictionaryItem {
  id: string;
  name: string;
  normalizedName: string;
}

export interface ExtractResumeSkillsInput {
  text: string;
  skills: ResumeSkillDictionaryItem[];
}

export interface ExtractedResumeSkill {
  skillId: string;
  matchedText: string;
  evidenceText: string;
  confidence: number;
}

export interface ExtractResumeSkillsResponse {
  skills: ExtractedResumeSkill[];
}

export interface ResumeSkillDictionaryItem {
  id: string;
  name: string;
  normalizedName: string;
}

export interface ResumeSkillAliasDictionaryItem {
  skillId: string;
  alias: string;
}

export interface ExtractResumeSkillsInput {
  text: string;
  skills: ResumeSkillDictionaryItem[];
  aliases: ResumeSkillAliasDictionaryItem[];
}

export interface ExtractedResumeSkill {
  skillId: string;
  matchedText: string;
  evidenceText: string;
  confidence: number;
}

export interface ExtractResumeSkillsResponse {
  skills: ExtractedResumeSkill[];
}