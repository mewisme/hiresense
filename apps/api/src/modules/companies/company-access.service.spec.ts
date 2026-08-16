import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';

import { CompanyAccessService } from './company-access.service';

import type { CompanyMembershipsRepository } from './repositories/company-memberships.repository';

describe('CompanyAccessService', () => {
  function createService(
    membership:
      | Record<string, unknown>
      | null,
  ) {
    const repository = {
      findActiveWithCompany:
        jest.fn()
          .mockResolvedValue(
            membership as never,
          ),
    } as unknown as CompanyMembershipsRepository;

    return new CompanyAccessService(
      repository,
    );
  }

  it(
    'should return active membership',
    async () => {
      const membership = {
        id:
          'membership-id',

        companyId:
          'company-id',

        userId:
          'user-id',

        role:
          'OWNER',

        status:
          'ACTIVE',

        company: {
          id:
            'company-id',

          status:
            'ACTIVE',

          deletedAt:
            null,
        },
      };

      const service =
        createService(
          membership,
        );

      await expect(
        service.requireActiveMembership(
          'user-id',
          'company-id',
        ),
      ).resolves.toMatchObject({
        role:
          'OWNER',
      });
    },
  );

  it(
    'should reject missing active membership',
    async () => {
      const service =
        createService(
          null,
        );

      await expect(
        service.requireActiveMembership(
          'user-id',
          'company-id',
        ),
      ).rejects.toThrow(
        ForbiddenException,
      );
    },
  );

  it(
    'should allow an authorized membership role',
    async () => {
      const service =
        createService({
          id:
            'membership-id',

          role:
            'RECRUITER',

          status:
            'ACTIVE',

          company: {
            id:
              'company-id',
          },
        });

      await expect(
        service.requireActiveMembership(
          'user-id',
          'company-id',
          [
            'OWNER',
            'ADMIN',
            'RECRUITER',
          ],
        ),
      ).resolves.toMatchObject({
        role:
          'RECRUITER',
      });
    },
  );

  it(
    'should reject an unauthorized membership role',
    async () => {
      const service =
        createService({
          id:
            'membership-id',

          role:
            'REVIEWER',

          status:
            'ACTIVE',

          company: {
            id:
              'company-id',
          },
        });

      await expect(
        service.requireActiveMembership(
          'user-id',
          'company-id',
          [
            'OWNER',
            'ADMIN',
          ],
        ),
      ).rejects.toThrow(
        ForbiddenException,
      );
    },
  );

  it(
    'should reject an unknown database role',
    async () => {
      const service =
        createService({
          id:
            'membership-id',

          role:
            'SUPER_OWNER',

          status:
            'ACTIVE',

          company: {
            id:
              'company-id',
          },
        });

      await expect(
        service.requireActiveMembership(
          'user-id',
          'company-id',
        ),
      ).rejects.toThrow(
        InternalServerErrorException,
      );
    },
  );
});