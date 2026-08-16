import {
  describe,
  expect,
  it,
} from '@jest/globals';

import { normalizeCompanySlug } from './company-slug.util';

describe('normalizeCompanySlug', () => {
  it(
    'should normalize spaces',
    () => {
      expect(
        normalizeCompanySlug(
          'HireSense Labs',
        ),
      ).toBe(
        'hiresense-labs',
      );
    },
  );

  it(
    'should normalize Vietnamese accents',
    () => {
      expect(
        normalizeCompanySlug(
          'Công ty Phần mềm ABC',
        ),
      ).toBe(
        'cong-ty-phan-mem-abc',
      );
    },
  );

  it(
    'should remove surrounding separators',
    () => {
      expect(
        normalizeCompanySlug(
          '---HireSense---',
        ),
      ).toBe(
        'hiresense',
      );
    },
  );

  it(
    'should collapse separators',
    () => {
      expect(
        normalizeCompanySlug(
          'HireSense   AI & Recruitment',
        ),
      ).toBe(
        'hiresense-ai-recruitment',
      );
    },
  );
});