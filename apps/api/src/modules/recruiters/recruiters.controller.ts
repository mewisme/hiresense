import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
} from '@nestjs/common';

import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

import { CreateRecruiterProfileDto } from './dto/create-recruiter-profile.dto';
import { UpdateRecruiterProfileDto } from './dto/update-recruiter-profile.dto';
import { RecruitersService } from './recruiters.service';

@Controller('recruiters')
@Auth('RECRUITER')
export class RecruitersController {
  constructor(
    private readonly recruitersService:
      RecruitersService,
  ) { }

  @Get('me')
  getMyProfile(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.recruitersService
      .getMyProfile(user.id);
  }

  @Post('me')
  createMyProfile(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: CreateRecruiterProfileDto,
  ) {
    return this.recruitersService
      .createMyProfile(
        user.id,
        dto,
      );
  }

  @Patch('me')
  updateMyProfile(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: UpdateRecruiterProfileDto,
  ) {
    return this.recruitersService
      .updateMyProfile(
        user.id,
        dto,
      );
  }
}