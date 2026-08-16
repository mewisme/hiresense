import { Injectable, NotFoundException } from '@nestjs/common';
import { PublicJobsQueryDto } from './dto/public-jobs-query.dto';
import { JobVersionsRepository } from './repositories/job-versions.repository';
import { JobsRepository } from './repositories/jobs.repository';

@Injectable()
export class PublicJobsService {
  constructor(
    private readonly jobsRepository: JobsRepository,
    private readonly jobVersionsRepository: JobVersionsRepository,
  ) { }

  async list(query: PublicJobsQueryDto) {
    const jobs = await this.jobsRepository.findPublicPublished(query.companyId);
    const jobsByVersionId = new Map<string, (typeof jobs)[number]>();
    const versionIds: string[] = [];

    for (const job of jobs) {
      if (!job.currentPublishedVersionId) continue;
      versionIds.push(job.currentPublishedVersionId);
      jobsByVersionId.set(job.currentPublishedVersionId, job);
    }

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    if (versionIds.length === 0) {
      return {
        items: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    const versionQuery = {
      q: query.q,
      employmentType: query.employmentType,
      workplaceType: query.workplaceType,
      skillId: query.skillId,
      skip,
      take: limit,
    };

    const [versions, total] = await Promise.all([
      this.jobVersionsRepository.findPublicCurrentVersions(versionIds, versionQuery),
      this.jobVersionsRepository.countPublicCurrentVersions(versionIds, versionQuery),
    ]);

    const items = versions.flatMap((version) => {
      const job = jobsByVersionId.get(version.id);
      return job ? [{ job, version }] : [];
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async getDetail(jobId: string) {
    const job = await this.jobsRepository.findPublicPublishedById(jobId);
    if (!job || !job.currentPublishedVersionId) throw new NotFoundException('Job not found');

    const version = await this.jobVersionsRepository.findPublishedByJobAndIdWithSkills(job.id, job.currentPublishedVersionId);
    if (!version) throw new NotFoundException('Job not found');

    return { job, version };
  }
}