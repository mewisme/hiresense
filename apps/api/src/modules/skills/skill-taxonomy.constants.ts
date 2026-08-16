export const REQUIRED_SKILL_CATEGORY_CODES = [
  'PROGRAMMING_LANGUAGE',
  'FRONTEND',
  'BACKEND',
  'DATABASE',
  'CLOUD',
  'DEVOPS',
  'TESTING',
  'AI_ML',
  'DATA',
  'SOFT_SKILL',
  'LANGUAGE',
] as const;

export type SkillCategoryCode =
  (typeof REQUIRED_SKILL_CATEGORY_CODES)[number];