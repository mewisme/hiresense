import { Injectable } from '@nestjs/common';
import { MatchingRepository } from '../repositories/matching.repository';

export interface JobSkillRequirement {
  jobVersionSkillId: string;
  skillId: string;
  name: string;
  normalizedName: string;
  importance: number;
  isRequired: boolean;
  weight: string;
  minExperienceMonths: number | null;
}

export interface JobSkillRequirementSnapshot {
  jobVersionId: string;
  jobId: string;
  versionNo: number;
  versionStatus: string;
  experienceMinMonths: number | null;
  experienceMaxMonths: number | null;
  educationMinLevel: string | null;
  skills: JobSkillRequirement[];
}

@Injectable()
export class JobSkillRequirementsService {
  constructor(private readonly matchingRepository: MatchingRepository) {}

  async getSnapshot(jobVersionId: string): Promise<JobSkillRequirementSnapshot | null> {
    const version = await this.matchingRepository.findJobVersionRequirements(jobVersionId);
    if (!version) return null;

    return {
      jobVersionId: version.id,
      jobId: version.jobId,
      versionNo: version.versionNo,
      versionStatus: version.versionStatus,
      experienceMinMonths: version.experienceMinMonths,
      experienceMaxMonths: version.experienceMaxMonths,
      educationMinLevel: version.educationMinLevel,
      skills: version.skills.map((item) => ({
        jobVersionSkillId: item.id,
        skillId: item.skillId,
        name: item.skill.name,
        normalizedName: item.skill.normalizedName,
        importance: item.importance,
        isRequired: item.isRequired,
        weight: item.weight.toString(),
        minExperienceMonths: item.minExperienceMonths,
      })),
    };
  }
}
