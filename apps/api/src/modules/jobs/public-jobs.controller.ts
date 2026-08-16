import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { PublicJobsQueryDto } from './dto/public-jobs-query.dto';
import { toPublicJobResponse } from './mappers/public-job-response.mapper';
import { PublicJobsService } from './public-jobs.service';

@Controller('jobs')
export class PublicJobsController {
  constructor(private readonly publicJobsService: PublicJobsService) { }

  @Get()
  async list(@Query() query: PublicJobsQueryDto) {
    const result = await this.publicJobsService.list(query);

    return {
      items: result.items.map((item) => toPublicJobResponse(item.job, item.version)),
      pagination: result.pagination,
    };
  }

  @Get(':jobId')
  async detail(@Param('jobId', ParseUUIDPipe) jobId: string) {
    const result = await this.publicJobsService.getDetail(jobId);
    return toPublicJobResponse(result.job, result.version);
  }
}