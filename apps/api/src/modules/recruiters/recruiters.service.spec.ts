import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  NotFoundException,
} from '@nestjs/common';

import { RecruitersService } from './recruiters.service';

import type {
  RecruiterProfilesRepository,
} from './repositories/recruiter-profiles.repository';

describe('RecruitersService', () => {
  function createService(
    repositoryOverrides: Partial<
      RecruiterProfilesRepository
    > = {},
  ) {
    const repository = {
      findByUserId:
        jest.fn(),

      create:
        jest.fn(),

      updateByUserId:
        jest.fn(),

      ...repositoryOverrides,
    } as unknown as RecruiterProfilesRepository;

    return {
      service:
        new RecruitersService(repository),

      repository,
    };
  }

  it(
    'should return recruiter profile',
    async () => {
      const profile = {
        id: 'profile-id',
        userId: 'user-id',
        fullName: 'Tran Thi B',
        phone: null,
        jobTitle:
          'Technical Recruiter',
      };

      const {
        service,
      } = createService({
        findByUserId:
          jest.fn()
            .mockResolvedValue(
              profile as never,
            ) as never,
      });

      await expect(
        service.getMyProfile(
          'user-id',
        ),
      ).resolves.toEqual(
        profile,
      );
    },
  );

  it(
    'should throw when recruiter profile does not exist',
    async () => {
      const {
        service,
      } = createService({
        findByUserId:
          jest.fn()
            .mockResolvedValue(
              null as never,
            ) as never,
      });

      await expect(
        service.getMyProfile(
          'user-id',
        ),
      ).rejects.toThrow(
        NotFoundException,
      );
    },
  );
});