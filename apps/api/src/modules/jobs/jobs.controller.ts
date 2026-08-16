import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { toJobResponse, toJobVersionResponse, toJobVersionWithSkillsResponse } from './mappers/job-response.mapper';
import { JobsService } from './jobs.service';

@Controller('companies/:companyId/jobs')
@Auth('RECRUITER')
export class JobsController {
  constructor(private readonly jobsService: JobsService) { }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() dto: CreateJobDto,
  ) {
    const result = await this.jobsService.create(companyId, user.id, dto);

    return {
      id: result.job.id,
      companyId: result.job.companyId,
      slug: result.job.slug,
      status: result.job.status,
      currentPublishedVersionId: result.job.currentPublishedVersionId,
      version: {
        id: result.version.id,
        versionNo: result.version.versionNo,
        versionStatus: result.version.versionStatus,
        title: result.version.title,
        summary: result.version.summary,
        description: result.version.description,
        responsibilities: result.version.responsibilities,
        benefits: result.version.benefits,
        employmentType: result.version.employmentType,
        workplaceType: result.version.workplaceType,
        experienceMinMonths: result.version.experienceMinMonths,
        experienceMaxMonths: result.version.experienceMaxMonths,
        salaryMin: result.version.salaryMin?.toString() ?? null,
        salaryMax: result.version.salaryMax?.toString() ?? null,
        salaryCurrency: result.version.salaryCurrency,
        createdAt: result.version.createdAt,
      },
      skills: result.skills.map((item) => ({
        skillId: item.skillId,
        name: item.skill.name,
        importance: item.importance,
        isRequired: item.isRequired,
        weight: item.weight.toString(),
        minExperienceMonths: item.minExperienceMonths,
      })),
      createdAt: result.job.createdAt,
      updatedAt: result.job.updatedAt,
    };
  }

  @Patch(':jobId')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: UpdateJobDto,
  ) {
    const result = await this.jobsService.update(companyId, jobId, user.id, dto);

    return {
      id: result.job.id,
      companyId: result.job.companyId,
      slug: result.job.slug,
      status: result.job.status,
      currentPublishedVersionId: result.job.currentPublishedVersionId,
      createdNewVersion: result.createdNewVersion,
      version: {
        id: result.version.id,
        versionNo: result.version.versionNo,
        versionStatus: result.version.versionStatus,
        title: result.version.title,
        summary: result.version.summary,
        description: result.version.description,
        responsibilities: result.version.responsibilities,
        benefits: result.version.benefits,
        employmentType: result.version.employmentType,
        workplaceType: result.version.workplaceType,
        experienceMinMonths: result.version.experienceMinMonths,
        experienceMaxMonths: result.version.experienceMaxMonths,
        salaryMin: result.version.salaryMin?.toString() ?? null,
        salaryMax: result.version.salaryMax?.toString() ?? null,
        salaryCurrency: result.version.salaryCurrency,
        createdAt: result.version.createdAt,
      },
      skills: result.version.skills.map((item) => ({
        skillId: item.skillId,
        name: item.skill.name,
        importance: item.importance,
        isRequired: item.isRequired,
        weight: item.weight.toString(),
        minExperienceMonths: item.minExperienceMonths,
      })),
    };
  }

  @Post(':jobId/publish')
  async publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    const result = await this.jobsService.publish(companyId, jobId, user.id);

    return {
      id: result.job.id,
      status: result.job.status,
      currentPublishedVersionId: result.job.currentPublishedVersionId,
      firstPublishedAt: result.job.firstPublishedAt,
      closedAt: result.job.closedAt,
      version: {
        id: result.version.id,
        versionNo: result.version.versionNo,
        versionStatus: result.version.versionStatus,
        publishedAt: result.version.publishedAt,
        title: result.version.title,
        description: result.version.description,
      },
    };
  }

  @Post(':jobId/pause')
  async pause(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.jobsService.pause(companyId, jobId, user.id);
  }

  @Post(':jobId/close')
  async close(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.jobsService.close(companyId, jobId, user.id);
  }

  @Post(':jobId/reopen')
  async reopen(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.jobsService.reopen(companyId, jobId, user.id);
  }

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ) {
    const results = await this.jobsService.listManaged(companyId, user.id);

    return results.map((result) => ({
      ...toJobResponse(result.job),
      currentDraftVersion: toJobVersionResponse(result.currentDraftVersion),
      currentPublishedVersion: toJobVersionResponse(result.currentPublishedVersion),
    }));
  }

  @Get(':jobId')
  async detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    const result = await this.jobsService.getManagedDetail(companyId, jobId, user.id);

    return {
      ...toJobResponse(result.job),
      currentDraftVersion: toJobVersionWithSkillsResponse(result.currentDraftVersion),
      currentPublishedVersion: toJobVersionWithSkillsResponse(result.currentPublishedVersion),
      versions: result.versions.map(toJobVersionResponse),
    };
  }

  @Post(':jobId/archive')
  async archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.jobsService.archive(companyId, jobId, user.id);
  }

  @Delete(':jobId')
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.jobsService.delete(companyId, jobId, user.id);
  }
}