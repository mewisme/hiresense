import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient =
  | PrismaService
  | Prisma.TransactionClient;

export interface CreateCompanyInput {
  name: string;
  slug: string;

  description?: string;
  websiteUrl?: string;

  companySizeMin?: number;
  companySizeMax?: number;

  createdByUserId: string;
}

@Injectable()
export class CompaniesRepository {
  constructor(
    private readonly prisma:
      PrismaService,
  ) { }

  findById(
    id: string,
    db: DbClient = this.prisma,
  ) {
    return db.company.findUnique({
      where: {
        id,
      },
    });
  }

  findBySlug(
    slug: string,
    db: DbClient = this.prisma,
  ) {
    return db.company.findUnique({
      where: {
        slug,
      },
    });
  }

  create(
    input: CreateCompanyInput,
    db: DbClient = this.prisma,
  ) {
    return db.company.create({
      data: {
        name:
          input.name,

        slug:
          input.slug,

        description:
          input.description,

        websiteUrl:
          input.websiteUrl,

        companySizeMin:
          input.companySizeMin,

        companySizeMax:
          input.companySizeMax,

        createdByUserId:
          input.createdByUserId,

        status:
          'ACTIVE',
      },
    });
  }
}