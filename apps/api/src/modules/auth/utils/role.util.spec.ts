import {
  describe,
  expect,
  it,
} from '@jest/globals';

import { parseAppRoles } from './role.util';

describe('parseAppRoles', () => {
  it(
    'should parse valid roles',
    () => {
      expect(
        parseAppRoles([
          'CANDIDATE',
          'RECRUITER',
        ]),
      ).toEqual([
        'CANDIDATE',
        'RECRUITER',
      ]);
    },
  );

  it(
    'should allow an empty role list',
    () => {
      expect(
        parseAppRoles([]),
      ).toEqual([]);
    },
  );

  it(
    'should reject an unknown role',
    () => {
      expect(() =>
        parseAppRoles([
          'CANDIDATE',
          'SUPER_ADMIN',
        ]),
      ).toThrow(
        'Unknown application role: SUPER_ADMIN',
      );
    },
  );
});