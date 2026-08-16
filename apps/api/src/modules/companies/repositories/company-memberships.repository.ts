import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

import type {
  CompanyMembershipRole,
  CompanyMembershipStatus,
} from '../types/company-membership.type';

type DbClient =
  | PrismaService
  | Prisma.TransactionClient;

export interface CreateCompanyMembershipInput {
  companyId: string;
  userId: string;

  role: CompanyMembershipRole;
  status: CompanyMembershipStatus;

  joinedAt?: Date;
}

@Injectable()
export class CompanyMembershipsRepository {
  constructor(
    private readonly prisma:
      PrismaService,
  ) { }

  findByCompanyAndUser(
    companyId: string,
    userId: string,
    db: DbClient = this.prisma,
  ) {
    return db.companyMembership.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
    });
  }

  findActiveByCompanyAndUser(
    companyId: string,
    userId: string,
    db: DbClient = this.prisma,
  ) {
    return db.companyMembership.findFirst({
      where: {
        companyId,
        userId,
        status: 'ACTIVE',
      },
    });
  }

  findActiveWithCompany(
    companyId: string,
    userId: string,
    db: DbClient = this.prisma,
  ) {
    return db.companyMembership.findFirst({
      where: {
        companyId,
        userId,
        status: 'ACTIVE',

        company: {
          status: 'ACTIVE',
          deletedAt: null,
        },
      },

      include: {
        company: true,
      },
    });
  }

  findActiveByUserId(
    userId: string,
    db: DbClient = this.prisma,
  ) {
    return db.companyMembership.findMany({
      where: {
        userId,
        status: 'ACTIVE',

        company: {
          status: 'ACTIVE',
          deletedAt: null,
        },
      },

      include: {
        company: true,
      },

      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  create(
    input: CreateCompanyMembershipInput,
    db: DbClient = this.prisma,
  ) {
    return db.companyMembership.create({
      data: {
        companyId:
          input.companyId,

        userId:
          input.userId,

        role:
          input.role,

        status:
          input.status,

        joinedAt:
          input.joinedAt,
      },
    });
  }
}