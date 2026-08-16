import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  APP_ROLES,
  isAppRole,
} from './role.type';

describe('role.type', () => {
  it.each(APP_ROLES)(
    'should recognize %s as an app role',
    (role) => {
      expect(
        isAppRole(role),
      ).toBe(true);
    },
  );

  it(
    'should reject unknown role',
    () => {
      expect(
        isAppRole('SUPER_ADMIN'),
      ).toBe(false);
    },
  );

  it(
    'should be case-sensitive',
    () => {
      expect(
        isAppRole('candidate'),
      ).toBe(false);
    },
  );

  it(
    'should reject empty role',
    () => {
      expect(
        isAppRole(''),
      ).toBe(false);
    },
  );
});