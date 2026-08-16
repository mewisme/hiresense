import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@Controller('companies')
@Auth(
  'RECRUITER',
  'ADMIN',
)
export class CompaniesController {
  constructor(
    private readonly companiesService:
      CompaniesService,
  ) { }

  @Post()
  createCompany(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: CreateCompanyDto,
  ) {
    return this.companiesService
      .createCompany(
        user.id,
        dto,
      );
  }

  @Get('me')
  getMyCompanies(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.companiesService
      .getMyCompanies(
        user.id,
      );
  }

  @Get(':companyId')
  getCompany(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param(
      'companyId',
      new ParseUUIDPipe({
        version: '7',
      }),
    )
    companyId: string,
  ) {
    return this.companiesService
      .getCompanyForMember(
        user.id,
        companyId,
      );
  }
}