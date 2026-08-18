import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AiClientService } from '../../infrastructure/ai/ai-client.service';
import { SkillsRepository } from '../skills/repositories/skills.repository';

@Injectable()
export class ResumeSkillExtractionService {
  constructor(
    private readonly aiClientService: AiClientService,
    private readonly skillsRepository: SkillsRepository,
  ) { }

  async extract(rawText: string) {
    const dictionary = await this.skillsRepository.findActiveDictionary();
    if (dictionary.length === 0) return [];

    const result = await this.aiClientService.extractResumeSkills({
      text: rawText,
      skills: dictionary.map((skill) => ({
        id: skill.id,
        name: skill.name,
        normalizedName: skill.normalizedName,
      })),
    });

    const canonicalById = new Map(dictionary.map((skill) => [skill.id, skill]));

    return result.skills.map((match) => {
      const skill = canonicalById.get(match.skillId);

      if (!skill) {
        throw new InternalServerErrorException(`AI service returned unknown canonical skill: ${match.skillId}`);
      }

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