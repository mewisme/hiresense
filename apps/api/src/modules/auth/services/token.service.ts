import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  createHash,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';

import type {
  TokenPayload,
  TokenType,
} from '../types/token-payload.type';

const DURATION_PATTERN =
  /^(\d+)(s|m|h|d)?$/i;

function parseDurationToSeconds(
  value: string,
  name: string,
): number {
  const match =
    DURATION_PATTERN.exec(value.trim());

  if (!match) {
    throw new InternalServerErrorException(
      `${name} must use a duration like 15m, 12h, or 30d`,
    );
  }

  const amount = Number(match[1]);
  const unit =
    (match[2] ?? 's').toLowerCase();

  const multiplier =
    unit === 'd'
      ? 86_400
      : unit === 'h'
        ? 3_600
        : unit === 'm'
          ? 60
          : 1;

  const seconds =
    amount * multiplier;

  if (
    !Number.isSafeInteger(seconds) ||
    seconds <= 0
  ) {
    throw new InternalServerErrorException(
      `${name} must be positive`,
    );
  }

  return seconds;
}

@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecret =
      this.configService.getOrThrow<string>(
        'auth.accessTokenSecret',
      );

    this.refreshSecret =
      this.configService.getOrThrow<string>(
        'auth.refreshTokenSecret',
      );

    const accessTtl =
      this.configService.getOrThrow<string>(
        'auth.accessTokenTtl',
      );

    const refreshTtl =
      this.configService.getOrThrow<string>(
        'auth.refreshTokenTtl',
      );

    this.accessTtlSeconds =
      parseDurationToSeconds(
        accessTtl,
        'JWT_ACCESS_TTL',
      );

    this.refreshTtlSeconds =
      parseDurationToSeconds(
        refreshTtl,
        'JWT_REFRESH_TTL',
      );

    if (
      this.accessSecret ===
      this.refreshSecret
    ) {
      throw new InternalServerErrorException(
        'JWT access and refresh secrets must be different',
      );
    }
  }

  getAccessTtlSeconds(): number {
    return this.accessTtlSeconds;
  }

  getRefreshTtlSeconds(): number {
    return this.refreshTtlSeconds;
  }

  getRefreshExpiresAt(
    from = new Date(),
  ): Date {
    return new Date(
      from.getTime() +
      this.refreshTtlSeconds * 1000,
    );
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256')
      .update(token, 'utf8')
      .digest('hex');
  }

  refreshTokenMatches(
    token: string,
    storedHash: string,
  ): boolean {
    if (!/^[0-9a-f]{64}$/i.test(storedHash)) {
      return false;
    }

    const actual = Buffer.from(
      this.hashRefreshToken(token),
      'hex',
    );

    const expected = Buffer.from(
      storedHash,
      'hex',
    );

    if (actual.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(
      actual,
      expected,
    );
  }

  signAccessToken(
    userId: string,
    sessionId: string,
  ): Promise<string> {
    return this.signToken(
      userId,
      sessionId,
      'access',
      this.accessTtlSeconds,
      this.accessSecret,
    );
  }

  signRefreshToken(
    userId: string,
    sessionId: string,
  ): Promise<string> {
    return this.signToken(
      userId,
      sessionId,
      'refresh',
      this.refreshTtlSeconds,
      this.refreshSecret,
    );
  }

  async issueTokenPair(
    userId: string,
    sessionId: string,
    sessionExpiresAt: Date,
  ) {
    const remainingSessionSeconds =
      Math.floor(
        (
          sessionExpiresAt.getTime() -
          Date.now()
        ) / 1000,
      );

    if (remainingSessionSeconds <= 0) {
      throw new UnauthorizedException(
        'Session has expired',
      );
    }

    const accessTokenExpiresIn =
      Math.min(
        this.accessTtlSeconds,
        remainingSessionSeconds,
      );

    const refreshTokenExpiresIn =
      Math.min(
        this.refreshTtlSeconds,
        remainingSessionSeconds,
      );

    const [
      accessToken,
      refreshToken,
    ] = await Promise.all([
      this.signToken(
        userId,
        sessionId,
        'access',
        accessTokenExpiresIn,
        this.accessSecret,
      ),

      this.signToken(
        userId,
        sessionId,
        'refresh',
        refreshTokenExpiresIn,
        this.refreshSecret,
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
  }

  verifyAccessToken(
    token: string,
  ): Promise<TokenPayload> {
    return this.verifyToken(
      token,
      'access',
      this.accessSecret,
    );
  }

  verifyRefreshToken(
    token: string,
  ): Promise<TokenPayload> {
    return this.verifyToken(
      token,
      'refresh',
      this.refreshSecret,
    );
  }

  private signToken(
    userId: string,
    sessionId: string,
    type: TokenType,
    expiresIn: number,
    secret: string,
  ): Promise<string> {
    const payload: TokenPayload = {
      sub: userId,
      sid: sessionId,
      typ: type,
      jti: randomUUID(),
    };

    return this.jwtService.signAsync(
      payload,
      {
        secret,
        expiresIn,
      },
    );
  }

  private async verifyToken(
    token: string,
    expectedType: TokenType,
    secret: string,
  ): Promise<TokenPayload> {
    try {
      const payload =
        await this.jwtService.verifyAsync<TokenPayload>(
          token,
          {
            secret,
          },
        );

      if (
        !payload.sub ||
        !payload.sid ||
        !payload.jti ||
        payload.typ !== expectedType
      ) {
        throw new UnauthorizedException(
          'Invalid token payload',
        );
      }

      return payload;
    } catch (error) {
      if (
        error instanceof
        UnauthorizedException
      ) {
        throw error;
      }

      throw new UnauthorizedException(
        'Invalid or expired token',
      );
    }
  }

}