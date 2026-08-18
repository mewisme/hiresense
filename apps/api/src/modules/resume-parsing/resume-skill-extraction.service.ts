import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AiClientService } from '../../infrastructure/ai/ai-client.service';
import { SkillsRepository } from '../skills/repositories/skills.repository';
import { readResumeSkillAliases } from './utils/resume-skill-alias.util';

@Injectable()
export class ResumeSkillExtractionService {
  constructor(
    private readonly aiClientService: AiClientService,
    private readonly skillsRepository: SkillsRepository,
  ) { }

  async extract(rawText: string, pipelineConfig: unknown) {
    const dictionary = await this.skillsRepository.findActiveDictionary();
    if (dictionary.length === 0) return [];

    const canonicalById = new Map(dictionary.map((skill) => [skill.id, skill]));
    const canonicalByNormalizedName = new Map(dictionary.map((skill) => [skill.normalizedName, skill]));
    const aliasConfig = readResumeSkillAliases(pipelineConfig);

    const aliases = aliasConfig.flatMap((item) => {
      const target = canonicalByNormalizedName.get(item.targetNormalizedName);
      if (!target) return [];

      const canonicalCollision = canonicalByNormalizedName.get(item.normalizedAlias);
      if (canonicalCollision && canonicalCollision.id !== target.id) {
        throw new InternalServerErrorException(`Skill alias conflicts with canonical skill: ${item.alias}`);
      }

      return [{
        skillId: target.id,
        alias: item.alias,
      }];
    });

    const result = await this.aiClientService.extractResumeSkills({
      text: rawText,
      skills: dictionary.map((skill) => ({
        id: skill.id,
        name: skill.name,
        normalizedName: skill.normalizedName,
      })),
      aliases,
    });

    return result.skills.map((match) => {
      const skill = canonicalById.get(match.skillId);
      if (!skill) throw new InternalServerErrorException(`AI service returned unknown canonical skill: ${match.skillId}`);

      return {
        skillId: skill.id,
        name: skill.name,
        normalizedName: skill.normalizedName,
        confidence: match.confidence,
        evidenceText: match.evidenceText,
        matchedText: match.matchedText,
      };
    });
  }
}