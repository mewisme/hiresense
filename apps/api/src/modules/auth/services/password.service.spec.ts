import {
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';

import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('should hash and verify a password', async () => {
    const password = 'VeryStrongPassword123!';

    const hash = await service.hash(password);

    expect(hash).not.toBe(password);

    await expect(
      service.verify(hash, password),
    ).resolves.toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const hash = await service.hash(
      'VeryStrongPassword123!',
    );

    await expect(
      service.verify(hash, 'WrongPassword123!'),
    ).resolves.toBe(false);
  });
});