import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { CompanyAccessService } from './company-access.service';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CompanyMembershipsRepository } from './repositories/company-memberships.repository';
import { CompaniesRepository } from './repositories/companies.repository';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    CompaniesController,
  ],

  providers: [
    CompaniesService,
    CompanyAccessService,
    CompaniesRepository,
    CompanyMembershipsRepository,
  ],

  exports: [
    CompaniesService,
    CompanyAccessService,
    CompaniesRepository,
    CompanyMembershipsRepository,
  ],
})
export class CompaniesModule { }