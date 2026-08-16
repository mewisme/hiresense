import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import type { PrismaService } from '../../infrastructure/database/prisma.service';

import { CompaniesService } from './companies.service';

import type { CompanyMembershipsRepository } from './repositories/company-memberships.repository';
import type { CompaniesRepository } from './repositories/companies.repository';
import { CompanyAccessService } from './company-access.service';

describe('CompaniesService', () => {
  function createService() {
    const tx = {
      company: {},
      companyMembership: {},
    };

    const prisma = {
      $transaction:
        jest.fn(
          async (
            callback: (
              transaction: unknown,
            ) => Promise<unknown>,
          ) => callback(tx),
        ),
    } as unknown as PrismaService;

    const companiesRepository = {
      create:
        jest.fn(),
    } as unknown as CompaniesRepository;

    const membershipsRepository = {
      create:
        jest.fn(),
    } as unknown as CompanyMembershipsRepository;

    const companyAccessService = {
      requireActiveMembership:
        jest.fn(),
    } as unknown as CompanyAccessService;

    return {
      service:
        new CompaniesService(
          prisma,
          companiesRepository,
          membershipsRepository,
          companyAccessService,
        ),

      prisma,
      companiesRepository,
      membershipsRepository,
      tx,
    };
  }

  it(
    'should create company and OWNER membership in one transaction',
    async () => {
      const {
        service,
        companiesRepository,
        membershipsRepository,
      } = createService();

      const company = {
        id: 'company-id',
        name: 'HireSense Labs',
        slug: 'hiresense-labs',
      };

      (
        companiesRepository.create as
        ReturnType<typeof jest.fn>
      ).mockResolvedValue(
        company,
      );

      (
        membershipsRepository.create as
        ReturnType<typeof jest.fn>
      ).mockResolvedValue({
        id: 'membership-id',
      });

      const result =
        await service.createCompany(
          'user-id',
          {
            name:
              'HireSense Labs',
          },
        );

      expect(result).toEqual(
        company,
      );

      expect(
        companiesRepository.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          name:
            'HireSense Labs',

          slug:
            'hiresense-labs',

          createdByUserId:
            'user-id',
        }),

        expect.anything(),
      );

      expect(
        membershipsRepository.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId:
            'company-id',

          userId:
            'user-id',

          role:
            'OWNER',

          status:
            'ACTIVE',
        }),

        expect.anything(),
      );
    },
  );

  it(
    'should use an explicitly supplied slug',
    async () => {
      const {
        service,
        companiesRepository,
        membershipsRepository,
      } = createService();

      (
        companiesRepository.create as
        ReturnType<typeof jest.fn>
      ).mockResolvedValue({
        id: 'company-id',
      });

      (
        membershipsRepository.create as
        ReturnType<typeof jest.fn>
      ).mockResolvedValue({
        id: 'membership-id',
      });

      await service.createCompany(
        'user-id',
        {
          name:
            'HireSense Vietnam',

          slug:
            'hiresense-vn',
        },
      );

      expect(
        companiesRepository.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          slug:
            'hiresense-vn',
        }),

        expect.anything(),
      );
    },
  );
});