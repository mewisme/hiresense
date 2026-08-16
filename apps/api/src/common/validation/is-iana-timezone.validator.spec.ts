import {
  describe,
  expect,
  it,
} from '@jest/globals';

import { isIanaTimeZone } from './is-iana-timezone.validator';

describe('isIanaTimeZone', () => {
  it(
    'should accept UTC',
    () => {
      expect(
        isIanaTimeZone('UTC'),
      ).toBe(true);
    },
  );

  it(
    'should accept Asia/Ho_Chi_Minh',
    () => {
      expect(
        isIanaTimeZone(
          'Asia/Ho_Chi_Minh',
        ),
      ).toBe(true);
    },
  );

  it(
    'should reject unknown timezone',
    () => {
      expect(
        isIanaTimeZone(
          'Asia/HireSense',
        ),
      ).toBe(false);
    },
  );

  it(
    'should reject empty value',
    () => {
      expect(
        isIanaTimeZone(''),
      ).toBe(false);
    },
  );

  it(
    'should reject non-string value',
    () => {
      expect(
        isIanaTimeZone(123),
      ).toBe(false);
    },
  );
});