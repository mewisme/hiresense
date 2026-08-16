import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  NotFoundException,
} from '@nestjs/common';

import { CandidatesService } from './candidates.service';

import type {
  CandidateProfilesRepository,
} from './repositories/candidate-profiles.repository';

describe('CandidatesService', () => {
  function createService(
    repositoryOverrides: Partial<
      CandidateProfilesRepository
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
    } as unknown as CandidateProfilesRepository;

    return {
      service:
        new CandidatesService(repository),

      repository,
    };
  }

  it(
    'should return candidate profile',
    async () => {
      const profile = {
        id: 'profile-id',
        userId: 'user-id',
        fullName: 'Nguyen Van A',
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
    'should throw when candidate profile does not exist',
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