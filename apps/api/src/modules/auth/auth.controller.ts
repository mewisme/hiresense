import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
} from '@nestjs/common';

import type { Request } from 'express';

import { AuthService } from './auth.service';
import type { AuthResponse } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { Auth } from './decorators/auth.decorator';
import type { AuthenticatedUser } from './types/authenticated-user.type';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService:
      AuthService,
  ) { }

  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Ip() ipAddress: string,
  ): Promise<AuthResponse> {
    return this.authService.register(
      dto,
      {
        userAgent:
          request.headers['user-agent'],

        ipAddress,
      },
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Ip() ipAddress: string,
  ): Promise<AuthResponse> {
    return this.authService.login(
      dto,
      {
        userAgent:
          request.headers['user-agent'],

        ipAddress,
      },
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @Body() dto: RefreshTokenDto,
  ): Promise<AuthResponse> {
    return this.authService.refresh(dto);
  }

  @Get('me')
  @Auth()
  me(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.authService.me(user);
  }

  @Post('logout')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser()
    user: AuthenticatedUser,
  ): Promise<void> {
    await this.authService.logout(user);
  }
}