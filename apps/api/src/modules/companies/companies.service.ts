import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import {
  Prisma as PrismaNamespace,
} from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

import type { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyMembershipsRepository } from './repositories/company-memberships.repository';
import {
  CompaniesRepository,
} from './repositories/companies.repository';
import { normalizeCompanySlug } from './utils/company-slug.util';
import { CompanyAccessService } from './company-access.service';

export type Company =
  Awaited<
    ReturnType<
      CompaniesRepository['create']
    >
  >;

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly companiesRepository:
      CompaniesRepository,

    private readonly membershipsRepository:
      CompanyMembershipsRepository,

    private readonly companyAccessService:
      CompanyAccessService,
  ) { }

  async createCompany(
    userId: string,
    dto: CreateCompanyDto,
  ): Promise<Company> {
    const slug =
      dto.slug ??
      normalizeCompanySlug(
        dto.name,
      );

    if (!slug) {
      throw new BadRequestException(
        'Company name cannot produce a valid slug',
      );
    }

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const company =
            await this.companiesRepository
              .create(
                {
                  name:
                    dto.name,

                  slug,

                  description:
                    dto.description,

                  websiteUrl:
                    dto.websiteUrl,

                  companySizeMin:
                    dto.companySizeMin,

                  companySizeMax:
                    dto.companySizeMax,

                  createdByUserId:
                    userId,
                },
                tx,
              );

          await this.membershipsRepository
            .create(
              {
                companyId:
                  company.id,

                userId,

                role:
                  'OWNER',

                status:
                  'ACTIVE',

                joinedAt:
                  new Date(),
              },
              tx,
            );

          return company;
        },
      );
    } catch (error) {
      if (
        error instanceof
        PrismaNamespace
          .PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Company slug is already in use',
        );
      }

      throw error;
    }
  }

  getMyCompanies(
    userId: string,
  ) {
    return this.membershipsRepository
      .findActiveByUserId(
        userId,
      );
  }

  async getCompanyForMember(
    userId: string,
    companyId: string,
  ) {
    const membership =
      await this.companyAccessService
        .requireActiveMembership(
          userId,
          companyId,
        );

    return {
      company:
        membership.company,

      membership: {
        id:
          membership.id,

        role:
          membership.role,

        status:
          membership.status,

        joinedAt:
          membership.joinedAt,
      },
    };
  }
}