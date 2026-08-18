import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ApplicationsService } from './applications.service';
import { ChangeApplicationStageDto } from './dto/change-application-stage.dto';
import { RecruiterApplicationsQueryDto } from './dto/recruiter-applications-query.dto';
import { toApplicationResponse } from './mappers/application-response.mapper';
import { toRecruiterApplicationDetailResponse, toRecruiterApplicationListItemResponse } from './mappers/recruiter-application-response.mapper';

@Controller('companies/:companyId')
@Auth('RECRUITER')
export class RecruiterApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }

  @Get('jobs/:jobId/applications')
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Query() query: RecruiterApplicationsQueryDto,
  ) {
    const result = await this.applicationsService.listForRecruiter(companyId, jobId, user.id, query);

    return {
      items: result.items.map(toRecruiterApplicationListItemResponse),
      pagination: result.pagination,
    };
  }

  @Get('applications/:applicationId')
  async getDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    const result = await this.applicationsService.getForRecruiter(companyId, applicationId, user.id);
    return toRecruiterApplicationDetailResponse(result.application, result.history);
  }

  @Patch('applications/:applicationId/stage')
  async changeStage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: ChangeApplicationStageDto,
  ) {
    const result = await this.applicationsService.changeStage(companyId, applicationId, user.id, dto);
    return toApplicationResponse(result.application, result.currentStage);
  }
}