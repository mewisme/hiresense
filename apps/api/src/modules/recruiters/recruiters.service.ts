import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Prisma as PrismaNamespace,
} from '../../generated/prisma/client';

import type { CreateRecruiterProfileDto } from './dto/create-recruiter-profile.dto';
import type { UpdateRecruiterProfileDto } from './dto/update-recruiter-profile.dto';

import {
  RecruiterProfilesRepository,
} from './repositories/recruiter-profiles.repository';

export type RecruiterProfile =
  NonNullable<
    Awaited<
      ReturnType<
        RecruiterProfilesRepository['findByUserId']
      >
    >
  >;

@Injectable()
export class RecruitersService {
  constructor(
    private readonly recruiterProfilesRepository:
      RecruiterProfilesRepository,
  ) { }

  async getMyProfile(
    userId: string,
  ): Promise<RecruiterProfile> {
    const profile =
      await this.recruiterProfilesRepository
        .findByUserId(userId);

    if (!profile) {
      throw new NotFoundException(
        'Recruiter profile not found',
      );
    }

    return profile;
  }

  async createMyProfile(
    userId: string,
    dto: CreateRecruiterProfileDto,
  ): Promise<RecruiterProfile> {
    try {
      return await this.recruiterProfilesRepository
        .create({
          userId,

          fullName:
            dto.fullName,

          phone:
            dto.phone ?? undefined,

          jobTitle:
            dto.jobTitle ?? undefined,
        });
    } catch (error) {
      if (
        error instanceof
        PrismaNamespace
          .PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Recruiter profile already exists',
        );
      }

      throw error;
    }
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateRecruiterProfileDto,
  ): Promise<RecruiterProfile> {
    try {
      return await this.recruiterProfilesRepository
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
          'Recruiter profile not found',
        );
      }

      throw error;
    }
  }
}