import {
  describe,
  expect,
  it,
} from '@jest/globals';
import { ValidationPipe } from '@nestjs/common';
import type { ArgumentMetadata } from '@nestjs/common';

import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: RegisterDto,
    data: '',
  };

  it('should normalize email', async () => {
    const result = await pipe.transform(
      {
        email: '  User@Example.COM ',
        password: 'StrongPassword123!',
        role: 'CANDIDATE',
      },
      metadata,
    );

    expect(result.email).toBe(
      'user@example.com',
    );
  });

  it('should reject ADMIN registration', async () => {
    await expect(
      pipe.transform(
        {
          email: 'admin@example.com',
          password: 'StrongPassword123!',
          role: 'ADMIN',
        },
        metadata,
      ),
    ).rejects.toThrow();
  });

  it('should reject short password', async () => {
    await expect(
      pipe.transform(
        {
          email: 'candidate@example.com',
          password: 'short',
          role: 'CANDIDATE',
        },
        metadata,
      ),
    ).rejects.toThrow();
  });

  it('should reject extra properties', async () => {
    await expect(
      pipe.transform(
        {
          email: 'candidate@example.com',
          password: 'StrongPassword123!',
          role: 'CANDIDATE',
          isAdmin: true,
        },
        metadata,
      ),
    ).rejects.toThrow();
  });
});