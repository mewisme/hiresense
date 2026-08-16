import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { Request } from 'express';

import { AuthSessionsRepository } from '../repositories/auth-sessions.repository';
import { TokenService } from '../services/token.service';
import type { AuthenticatedUser } from '../types/authenticated-user.type';
import { isAppRole, type AppRole } from '../types/role.type';
import { parseAppRoles } from '../utils/role.util';

type AuthenticatedRequest =
  Request & {
    user?: AuthenticatedUser;
  };

@Injectable()
export class JwtAuthGuard
  implements CanActivate {
  constructor(
    private readonly tokenService:
      TokenService,

    private readonly sessionsRepository:
      AuthSessionsRepository,
  ) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp()
        .getRequest<AuthenticatedRequest>();

    const token =
      this.extractBearerToken(request);

    const payload =
      await this.tokenService
        .verifyAccessToken(token);

    const session =
      await this.sessionsRepository
        .findByIdWithUser(payload.sid);

    const now = new Date();

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt !== null ||
      session.expiresAt <= now
    ) {
      throw new UnauthorizedException(
        'Session is no longer active',
      );
    }

    if (
      session.user.status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException(
        'Account is not active',
      );
    }

    let roles: AppRole[];

    try {
      roles = parseAppRoles(
        session.user.userRoles.map(
          ({ role }) => role.code,
        ),
      );
    } catch {
      throw new UnauthorizedException(
        'Account contains invalid roles',
      );
    }

    request.user = {
      id: session.user.id,
      sessionId: session.id,
      email: session.user.email,
      roles,
    };

    return true;
  }

  private extractBearerToken(
    request: Request,
  ): string {
    const authorization =
      request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException(
        'Bearer access token is required',
      );
    }

    const [
      type,
      token,
    ] = authorization.split(' ');

    if (
      type !== 'Bearer' ||
      !token
    ) {
      throw new UnauthorizedException(
        'Bearer access token is required',
      );
    }

    return token;
  }
}