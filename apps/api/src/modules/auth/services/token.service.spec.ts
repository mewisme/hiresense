import {
  describe,
  expect,
  it,
} from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { TokenService } from './token.service';

describe('TokenService', () => {
  const USER_ID = 'user-id';
  const SESSION_ID = 'session-id';

  function createService(): TokenService {
    const configService = new ConfigService({
      auth: {
        accessTokenSecret:
          'test-access-secret-123456789',

        refreshTokenSecret:
          'test-refresh-secret-987654321',

        accessTokenTtl: '15m',
        refreshTokenTtl: '30d',
      },
    });

    return new TokenService(
      new JwtService(),
      configService,
    );
  }

  function createFutureSessionExpiry(): Date {
    return new Date(
      Date.now() +
      30 * 24 * 60 * 60 * 1000,
    );
  }

  it(
    'should issue access and refresh tokens',
    async () => {
      const service = createService();

      const tokens =
        await service.issueTokenPair(
          USER_ID,
          SESSION_ID,
          createFutureSessionExpiry(),
        );

      expect(
        tokens.accessToken,
      ).toBeTruthy();

      expect(
        tokens.refreshToken,
      ).toBeTruthy();

      expect(
        tokens.accessToken,
      ).not.toBe(
        tokens.refreshToken,
      );

      expect(
        tokens.accessTokenExpiresIn,
      ).toBe(15 * 60);

      expect(
        tokens.refreshTokenExpiresIn,
      ).toBeGreaterThan(0);

      expect(
        tokens.refreshTokenExpiresIn,
      ).toBeLessThanOrEqual(
        30 * 24 * 60 * 60,
      );
    },
  );

  it(
    'should verify an access token',
    async () => {
      const service = createService();

      const tokens =
        await service.issueTokenPair(
          USER_ID,
          SESSION_ID,
          createFutureSessionExpiry(),
        );

      const payload =
        await service.verifyAccessToken(
          tokens.accessToken,
        );

      expect(payload.sub).toBe(
        USER_ID,
      );

      expect(payload.sid).toBe(
        SESSION_ID,
      );

      expect(payload.typ).toBe(
        'access',
      );

      expect(payload.jti).toBeTruthy();
    },
  );

  it(
    'should verify a refresh token',
    async () => {
      const service = createService();

      const tokens =
        await service.issueTokenPair(
          USER_ID,
          SESSION_ID,
          createFutureSessionExpiry(),
        );

      const payload =
        await service.verifyRefreshToken(
          tokens.refreshToken,
        );

      expect(payload.sub).toBe(
        USER_ID,
      );

      expect(payload.sid).toBe(
        SESSION_ID,
      );

      expect(payload.typ).toBe(
        'refresh',
      );

      expect(payload.jti).toBeTruthy();
    },
  );

  it(
    'should reject a refresh token as an access token',
    async () => {
      const service = createService();

      const tokens =
        await service.issueTokenPair(
          USER_ID,
          SESSION_ID,
          createFutureSessionExpiry(),
        );

      await expect(
        service.verifyAccessToken(
          tokens.refreshToken,
        ),
      ).rejects.toThrow(
        'Invalid or expired token',
      );
    },
  );

  it(
    'should reject an access token as a refresh token',
    async () => {
      const service = createService();

      const tokens =
        await service.issueTokenPair(
          USER_ID,
          SESSION_ID,
          createFutureSessionExpiry(),
        );

      await expect(
        service.verifyRefreshToken(
          tokens.accessToken,
        ),
      ).rejects.toThrow(
        'Invalid or expired token',
      );
    },
  );

  it(
    'should reject an invalid token',
    async () => {
      const service = createService();

      await expect(
        service.verifyAccessToken(
          'invalid-token',
        ),
      ).rejects.toThrow(
        'Invalid or expired token',
      );
    },
  );

  it(
    'should reject token issuing for an expired session',
    async () => {
      const service = createService();

      const expiredAt = new Date(
        Date.now() - 1_000,
      );

      await expect(
        service.issueTokenPair(
          USER_ID,
          SESSION_ID,
          expiredAt,
        ),
      ).rejects.toThrow(
        'Session has expired',
      );
    },
  );

  it(
    'should not issue tokens beyond session expiration',
    async () => {
      const service = createService();

      const sessionExpiresAt =
        new Date(
          Date.now() + 5 * 60 * 1000,
        );

      const tokens =
        await service.issueTokenPair(
          USER_ID,
          SESSION_ID,
          sessionExpiresAt,
        );

      expect(
        tokens.accessTokenExpiresIn,
      ).toBeLessThanOrEqual(
        5 * 60,
      );

      expect(
        tokens.refreshTokenExpiresIn,
      ).toBeLessThanOrEqual(
        5 * 60,
      );
    },
  );

  it(
    'should hash a refresh token using SHA-256',
    () => {
      const service = createService();

      const hash =
        service.hashRefreshToken(
          'some-refresh-token',
        );

      expect(hash).toMatch(
        /^[0-9a-f]{64}$/,
      );

      expect(hash).not.toBe(
        'some-refresh-token',
      );
    },
  );

  it(
    'should match a valid refresh token hash',
    () => {
      const service = createService();

      const refreshToken =
        'some-refresh-token';

      const hash =
        service.hashRefreshToken(
          refreshToken,
        );

      expect(
        service.refreshTokenMatches(
          refreshToken,
          hash,
        ),
      ).toBe(true);
    },
  );

  it(
    'should reject an incorrect refresh token hash',
    () => {
      const service = createService();

      const hash =
        service.hashRefreshToken(
          'correct-refresh-token',
        );

      expect(
        service.refreshTokenMatches(
          'wrong-refresh-token',
          hash,
        ),
      ).toBe(false);
    },
  );

  it(
    'should reject malformed stored refresh token hash',
    () => {
      const service = createService();

      expect(
        service.refreshTokenMatches(
          'refresh-token',
          'not-a-valid-sha256-hash',
        ),
      ).toBe(false);
    },
  );
});