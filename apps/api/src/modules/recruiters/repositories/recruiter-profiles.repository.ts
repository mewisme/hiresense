import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient =
  | PrismaService
  | Prisma.TransactionClient;

export interface CreateRecruiterProfileInput {
  userId: string;
  fullName: string;
  phone?: string;
  jobTitle?: string;
}

export interface UpdateRecruiterProfileInput {
  fullName?: string;
  phone?: string | null;
  jobTitle?: string | null;
}

@Injectable()
export class RecruiterProfilesRepository {
  constructor(
    private readonly prisma:
      PrismaService,
  ) { }

  findByUserId(
    userId: string,
    db: DbClient = this.prisma,
  ) {
    return db.recruiterProfile.findUnique({
      where: {
        userId,
      },
    });
  }

  findById(
    id: string,
    db: DbClient = this.prisma,
  ) {
    return db.recruiterProfile.findUnique({
      where: {
        id,
      },
    });
  }

  create(
    input: CreateRecruiterProfileInput,
    db: DbClient = this.prisma,
  ) {
    return db.recruiterProfile.create({
      data: {
        userId:
          input.userId,

        fullName:
          input.fullName,

        phone:
          input.phone,

        jobTitle:
          input.jobTitle,
      },
    });
  }

  updateByUserId(
    userId: string,
    input: UpdateRecruiterProfileInput,
    db: DbClient = this.prisma,
  ) {
    return db.recruiterProfile.update({
      where: {
        userId,
      },

      data: input,
    });
  }
}