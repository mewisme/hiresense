import { normalizeSkillName } from '../../skills/utils/skill-name.util';

export interface ResumeSkillAliasConfigItem {
  alias: string;
  normalizedAlias: string;
  targetNormalizedName: string;
}

export function readResumeSkillAliases(config: unknown): ResumeSkillAliasConfigItem[] {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return [];

  const skillAliases = (config as Record<string, unknown>).skillAliases;
  if (!skillAliases || typeof skillAliases !== 'object' || Array.isArray(skillAliases)) return [];

  const items: ResumeSkillAliasConfigItem[] = [];

  for (const [alias, target] of Object.entries(skillAliases)) {
    if (typeof target !== 'string') continue;

    const normalizedAlias = normalizeSkillName(alias);
    const targetNormalizedName = normalizeSkillName(target);

    if (!normalizedAlias || !targetNormalizedName) continue;

    items.push({
      alias: alias.trim(),
      normalizedAlias,
      targetNormalizedName,
    });
  }

  return items;
}