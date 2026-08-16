import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient =
  | PrismaService
  | Prisma.TransactionClient;

export interface CreateCandidateProfileInput {
  userId: string;
  fullName: string;

  phone?: string;
  headline?: string;
  summary?: string;

  city?: string;
  region?: string;
  countryCode?: string;

  timezone?: string;

  experienceMonthsDeclared?: number;

  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

export interface UpdateCandidateProfileInput {
  fullName?: string;

  phone?: string | null;
  headline?: string | null;
  summary?: string | null;

  city?: string | null;
  region?: string | null;
  countryCode?: string | null;

  timezone?: string;

  experienceMonthsDeclared?:
  | number
  | null;

  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
}

@Injectable()
export class CandidateProfilesRepository {
  constructor(
    private readonly prisma:
      PrismaService,
  ) { }

  findByUserId(
    userId: string,
    db: DbClient = this.prisma,
  ) {
    return db.candidateProfile.findUnique({
      where: {
        userId,
      },
    });
  }

  findById(
    id: string,
    db: DbClient = this.prisma,
  ) {
    return db.candidateProfile.findUnique({
      where: {
        id,
      },
    });
  }

  create(
    input: CreateCandidateProfileInput,
    db: DbClient = this.prisma,
  ) {
    return db.candidateProfile.create({
      data: {
        userId:
          input.userId,

        fullName:
          input.fullName,

        phone:
          input.phone,

        headline:
          input.headline,

        summary:
          input.summary,

        city:
          input.city,

        region:
          input.region,

        countryCode:
          input.countryCode,

        timezone:
          input.timezone,

        experienceMonthsDeclared:
          input.experienceMonthsDeclared,

        portfolioUrl:
          input.portfolioUrl,

        githubUrl:
          input.githubUrl,

        linkedinUrl:
          input.linkedinUrl,
      },
    });
  }

  updateByUserId(
    userId: string,
    input: UpdateCandidateProfileInput,
    db: DbClient = this.prisma,
  ) {
    return db.candidateProfile.update({
      where: {
        userId,
      },

      data: input,
    });
  }
}