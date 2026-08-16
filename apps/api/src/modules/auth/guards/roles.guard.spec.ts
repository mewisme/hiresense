import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type {
  ExecutionContext,
} from '@nestjs/common';
import {
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  function createContext(
    roles: string[],
  ): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),

      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: 'user-id',
            sessionId:
              'session-id',
            email:
              'user@example.com',
            roles,
          },
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it(
    'should allow when no roles are required',
    () => {
      const reflector = {
        getAllAndOverride:
          jest.fn()
            .mockReturnValue(
              undefined,
            ),
      } as unknown as Reflector;

      const guard =
        new RolesGuard(reflector);

      expect(
        guard.canActivate(
          createContext([
            'CANDIDATE',
          ]),
        ),
      ).toBe(true);
    },
  );

  it(
    'should allow matching role',
    () => {
      const reflector = {
        getAllAndOverride:
          jest.fn()
            .mockReturnValue([
              'RECRUITER',
            ]),
      } as unknown as Reflector;

      const guard =
        new RolesGuard(reflector);

      expect(
        guard.canActivate(
          createContext([
            'RECRUITER',
          ]),
        ),
      ).toBe(true);
    },
  );

  it(
    'should allow one of multiple roles',
    () => {
      const reflector = {
        getAllAndOverride:
          jest.fn()
            .mockReturnValue([
              'RECRUITER',
              'ADMIN',
            ]),
      } as unknown as Reflector;

      const guard =
        new RolesGuard(reflector);

      expect(
        guard.canActivate(
          createContext([
            'ADMIN',
          ]),
        ),
      ).toBe(true);
    },
  );

  it(
    'should reject missing role',
    () => {
      const reflector = {
        getAllAndOverride:
          jest.fn()
            .mockReturnValue([
              'RECRUITER',
            ]),
      } as unknown as Reflector;

      const guard =
        new RolesGuard(reflector);

      expect(() =>
        guard.canActivate(
          createContext([
            'CANDIDATE',
          ]),
        ),
      ).toThrow(
        ForbiddenException,
      );
    },
  );
});