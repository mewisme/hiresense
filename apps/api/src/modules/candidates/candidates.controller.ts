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

import { CandidatesService } from './candidates.service';
import { CreateCandidateProfileDto } from './dto/create-candidate-profile.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';

@Controller('candidates')
@Auth('CANDIDATE')
export class CandidatesController {
  constructor(
    private readonly candidatesService:
      CandidatesService,
  ) { }

  @Get('me')
  getMyProfile(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.candidatesService
      .getMyProfile(user.id);
  }

  @Post('me')
  createMyProfile(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: CreateCandidateProfileDto,
  ) {
    return this.candidatesService
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
    dto: UpdateCandidateProfileDto,
  ) {
    return this.candidatesService
      .updateMyProfile(
        user.id,
        dto,
      );
  }
}