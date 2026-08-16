import {
  applyDecorators,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import type { AppRole } from '../types/role.type';

import { Roles } from './roles.decorator';

export function Auth(
  ...roles: AppRole[]
) {
  if (roles.length === 0) {
    return applyDecorators(
      UseGuards(
        JwtAuthGuard,
        RolesGuard,
      ),
    );
  }

  return applyDecorators(
    UseGuards(
      JwtAuthGuard,
      RolesGuard,
    ),
    Roles(...roles),
  );
}