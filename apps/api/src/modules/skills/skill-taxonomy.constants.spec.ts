import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  REQUIRED_SKILL_CATEGORY_CODES,
} from './skill-taxonomy.constants';

describe(
  'REQUIRED_SKILL_CATEGORY_CODES',
  () => {
    it(
      'should contain the canonical internship categories',
      () => {
        expect(
          REQUIRED_SKILL_CATEGORY_CODES,
        ).toEqual([
          'PROGRAMMING_LANGUAGE',
          'FRONTEND',
          'BACKEND',
          'DATABASE',
          'CLOUD',
          'DEVOPS',
          'TESTING',
          'AI_ML',
          'DATA',
          'SOFT_SKILL',
          'LANGUAGE',
        ]);
      },
    );

    it(
      'should not contain duplicates',
      () => {
        expect(
          new Set(
            REQUIRED_SKILL_CATEGORY_CODES,
          ).size,
        ).toBe(
          REQUIRED_SKILL_CATEGORY_CODES.length,
        );
      },
    );
  },
);