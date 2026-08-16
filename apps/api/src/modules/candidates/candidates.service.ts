import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Prisma as PrismaNamespace,
} from '../../generated/prisma/client';

import type { CreateCandidateProfileDto } from './dto/create-candidate-profile.dto';
import type { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';

import {
  CandidateProfilesRepository,
} from './repositories/candidate-profiles.repository';

export type CandidateProfile =
  NonNullable<
    Awaited<
      ReturnType<
        CandidateProfilesRepository['findByUserId']
      >
    >
  >;

@Injectable()
export class CandidatesService {
  constructor(
    private readonly candidateProfilesRepository:
      CandidateProfilesRepository,
  ) { }

  async getMyProfile(
    userId: string,
  ): Promise<CandidateProfile> {
    const profile =
      await this.candidateProfilesRepository
        .findByUserId(userId);

    if (!profile) {
      throw new NotFoundException(
        'Candidate profile not found',
      );
    }

    return profile;
  }

  async createMyProfile(
    userId: string,
    dto: CreateCandidateProfileDto,
  ): Promise<CandidateProfile> {
    try {
      return await this.candidateProfilesRepository
        .create({
          userId,

          fullName:
            dto.fullName,

          phone:
            dto.phone ?? undefined,

          headline:
            dto.headline ?? undefined,

          summary:
            dto.summary ?? undefined,

          city:
            dto.city ?? undefined,

          region:
            dto.region ?? undefined,

          countryCode:
            dto.countryCode ?? undefined,

          timezone:
            dto.timezone,

          experienceMonthsDeclared:
            dto.experienceMonthsDeclared ??
            undefined,

          portfolioUrl:
            dto.portfolioUrl ?? undefined,

          githubUrl:
            dto.githubUrl ?? undefined,

          linkedinUrl:
            dto.linkedinUrl ?? undefined,
        });
    } catch (error) {
      if (
        error instanceof
        PrismaNamespace
          .PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Candidate profile already exists',
        );
      }

      throw error;
    }
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateCandidateProfileDto,
  ): Promise<CandidateProfile> {
    try {
      return await this.candidateProfilesRepository
        .updateByUserId(
          userId,
          dto,
        );
    } catch (error) {
      if (
        error instanceof
        PrismaNamespace
          .PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          'Candidate profile not found',
        );
      }

      throw error;
    }
  }
}