import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../types/authenticated-user.type';
import type { AppRole } from '../types/role.type';

@Injectable()
export class RolesGuard
  implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) { }

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<
        AppRole[]
      >(
        ROLES_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (
      !requiredRoles ||
      requiredRoles.length === 0
    ) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest<{
        user?: AuthenticatedUser;
      }>();

    const user = request.user;

    if (!user) {
      throw new ForbiddenException(
        'Authenticated user is required',
      );
    }

    const hasRequiredRole =
      requiredRoles.some(
        (requiredRole) =>
          user.roles.includes(
            requiredRole,
          ),
      );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        'Insufficient permissions',
      );
    }

    return true;
  }
}