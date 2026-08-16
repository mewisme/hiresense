import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  UsersService,
  type UserWithRoles,
} from '../users/users.service';

import type { AuthResponse } from './dto/auth-response.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { AuthSessionsRepository } from './repositories/auth-sessions.repository';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthenticatedUser } from './types/authenticated-user.type';
import { parseAppRoles } from './utils/role.util';

export interface RequestMetadata {
  userAgent?: string;
  ipAddress?: string;
  deviceName?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,

    private readonly sessionsRepository:
      AuthSessionsRepository,

    private readonly passwordService:
      PasswordService,

    private readonly tokenService:
      TokenService,
  ) { }

  async register(
    dto: RegisterDto,
    metadata: RequestMetadata,
  ): Promise<AuthResponse> {
    const existingUser =
      await this.usersService.findByEmail(
        dto.email,
      );

    if (existingUser) {
      throw new ConflictException(
        'Email is already registered',
      );
    }

    const passwordHash =
      await this.passwordService.hash(
        dto.password,
      );

    return this.prisma.$transaction(
      async (tx) => {
        const user =
          await this.usersService.createIdentity(
            {
              email: dto.email,
              passwordHash,
              roleCode: dto.role,
            },
            tx,
          );

        return this.createSessionAndResponse(
          user,
          metadata,
          tx,
        );
      },
    );
  }

  async login(
    dto: LoginDto,
    metadata: RequestMetadata,
  ): Promise<AuthResponse> {
    const user =
      await this.usersService.findByEmail(
        dto.email,
      );

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Account is not active',
      );
    }

    const passwordValid =
      await this.passwordService.verify(
        user.passwordHash,
        dto.password,
      );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        return this.createSessionAndResponse(
          user,
          metadata,
          tx,
        );
      },
    );
  }

  async logout(
    user: AuthenticatedUser,
  ): Promise<void> {
    await this.sessionsRepository.revoke(
      user.sessionId,
      user.id,
    );
  }

  async refresh(
    dto: RefreshTokenDto,
  ): Promise<AuthResponse> {
    const payload =
      await this.tokenService.verifyRefreshToken(
        dto.refreshToken,
      );

    const session =
      await this.sessionsRepository.findByIdWithUser(
        payload.sid,
      );

    const now = new Date();

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt !== null ||
      session.expiresAt <= now
    ) {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }

    if (session.user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Account is not active',
      );
    }

    const validRefreshToken =
      this.tokenService.refreshTokenMatches(
        dto.refreshToken,
        session.refreshTokenHash,
      );

    if (!validRefreshToken) {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }

    const tokens =
      await this.tokenService.issueTokenPair(
        session.userId,
        session.id,
        session.expiresAt,
      );

    const nextHash =
      this.tokenService.hashRefreshToken(
        tokens.refreshToken,
      );

    const rotated =
      await this.sessionsRepository.rotateRefreshToken(
        {
          sessionId: session.id,

          expectedCurrentHash:
            session.refreshTokenHash,

          nextHash,

          usedAt: now,
        },
      );

    if (!rotated) {
      throw new UnauthorizedException(
        'Refresh token has already been used',
      );
    }

    return {
      ...tokens,

      tokenType: 'Bearer',

      user: {
        id: session.user.id,
        email: session.user.email,

        roles: parseAppRoles(
          session.user.userRoles.map(
            ({ role }) => role.code,
          ),
        ),
      },
    };
  }

  me(
    user: AuthenticatedUser,
  ) {
    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
    };
  }

  private async createSessionAndResponse(
    user: UserWithRoles,
    metadata: RequestMetadata,
    tx: Prisma.TransactionClient,
  ): Promise<AuthResponse> {
    const expiresAt =
      this.tokenService.getRefreshExpiresAt();

    const session =
      await this.sessionsRepository.create(
        {
          userId: user.id,

          expiresAt,

          userAgent:
            metadata.userAgent,

          ipAddress:
            metadata.ipAddress,

          deviceName:
            metadata.deviceName,
        },
        tx,
      );

    const tokens =
      await this.tokenService.issueTokenPair(
        user.id,
        session.id,
        session.expiresAt,
      );

    const refreshTokenHash =
      this.tokenService.hashRefreshToken(
        tokens.refreshToken,
      );

    await this.sessionsRepository
      .updateRefreshTokenHash(
        session.id,
        refreshTokenHash,
        tx,
      );

    return {
      ...tokens,

      tokenType: 'Bearer',

      user:
        this.usersService.toPublicIdentity(
          user,
        ),
    };
  }
}