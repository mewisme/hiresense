import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from '../users/users.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSessionsRepository } from './repositories/auth-sessions.repository';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Auth } from './decorators/auth.decorator';

@Module({
  imports: [
    JwtModule.register({}),
    UsersModule,
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
    AuthSessionsRepository,
    PasswordService,
    TokenService,
    JwtAuthGuard,
    RolesGuard,
  ],

  exports: [
    Auth
  ],
})
export class AuthModule { }