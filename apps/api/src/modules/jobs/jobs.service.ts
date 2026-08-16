import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import type { JobVersion } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import type { CreateJobSkillDto } from './dto/create-job-skill.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobCompanyMembershipsRepository } from './repositories/job-company-memberships.repository';
import { JobVersionSkillsRepository } from './repositories/job-version-skills.repository';
import { JobVersionsRepository } from './repositories/job-versions.repository';
import { JobsRepository } from './repositories/jobs.repository';
import { createJobSlug } from './utils/job-slug.util';

const JOB_MANAGE_MEMBERSHIP_ROLES = new Set(['OWNER', 'ADMIN', 'RECRUITER']);
const JOB_VIEW_MEMBERSHIP_ROLES = new Set(['OWNER', 'ADMIN', 'RECRUITER', 'REVIEWER']);

type EditableJobVersion = {
  title: string;
  summary: string | null;
  description: string;
  responsibilities: string | null;
  benefits: string | null;
  employmentType: string | null;
  workplaceType: string | null;
  experienceMinMonths: number | null;
  experienceMaxMonths: number | null;
  salaryMin: Prisma.Decimal | null;
  salaryMax: Prisma.Decimal | null;
  salaryCurrency: string | null;
};

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsRepository: JobsRepository,
    private readonly jobVersionsRepository: JobVersionsRepository,
    private readonly jobVersionSkillsRepository: JobVersionSkillsRepository,
    private readonly membershipsRepository: JobCompanyMembershipsRepository,
  ) { }

  async create(companyId: string, userId: string, dto: CreateJobDto) {
    this.validateRanges(dto);

    const skills = dto.skills ?? [];
    this.validateDuplicateSkills(skills.map((skill) => skill.skillId));

    return this.prisma.$transaction(async (tx) => {
      await this.requireManageMembership(companyId, userId, tx);
      await this.validateSkills(skills, tx);

      const job = await this.jobsRepository.create({
        companyId,
        createdByUserId: userId,
        slug: createJobSlug(dto.title),
        status: 'DRAFT',
      }, tx);

      const version = await this.jobVersionsRepository.create({
        jobId: job.id,
        versionNo: 1,
        title: dto.title,
        summary: dto.summary ?? null,
        description: dto.description,
        responsibilities: dto.responsibilities ?? null,
        benefits: dto.benefits ?? null,
        employmentType: dto.employmentType ?? null,
        workplaceType: dto.workplaceType ?? null,
        experienceMinMonths: dto.experienceMinMonths ?? null,
        experienceMaxMonths: dto.experienceMaxMonths ?? null,
        salaryMin: dto.salaryMin ? new Prisma.Decimal(dto.salaryMin) : null,
        salaryMax: dto.salaryMax ? new Prisma.Decimal(dto.salaryMax) : null,
        salaryCurrency: dto.salaryCurrency ?? null,
        createdByUserId: userId,
      }, tx);

      await this.jobVersionSkillsRepository.createMany(skills.map((skill) => ({
        jobVersionId: version.id,
        skillId: skill.skillId,
        importance: skill.importance ?? 3,
        isRequired: skill.isRequired ?? true,
        weight: new Prisma.Decimal(skill.weight ?? '1'),
        minExperienceMonths: skill.minExperienceMonths ?? null,
      })), tx);

      const versionSkills = await this.jobVersionSkillsRepository.findByJobVersionId(version.id, tx);

      return { job, version, skills: versionSkills };
    });
  }

  async update(companyId: string, jobId: string, userId: string, dto: UpdateJobDto) {
    this.validateUpdatePayload(dto);

    if (dto.skills !== undefined) {
      this.validateDuplicateSkills(dto.skills.map((skill) => skill.skillId));
    }

    return this.prisma.$transaction(async (tx) => {
      await this.requireManageMembership(companyId, userId, tx);

      if (dto.skills !== undefined) {
        await this.validateSkills(dto.skills, tx);
      }

      const locked = await this.jobsRepository.lockActiveOwnedById(jobId, companyId, tx);
      if (!locked) throw new NotFoundException('Job not found');

      const job = await this.jobsRepository.findActiveOwnedById(jobId, companyId, tx);
      if (!job) throw new NotFoundException('Job not found');

      if (job.status === 'ARCHIVED') {
        throw new BadRequestException('Archived job cannot be edited');
      }

      const latest = await this.jobVersionsRepository.findLatestByJobId(job.id, tx);
      if (!latest) throw new NotFoundException('Job version not found');

      if (latest.versionStatus === 'DRAFT') {
        const merged = this.mergeVersion(latest, dto);
        this.validateMergedRanges(merged);

        const updated = await this.jobVersionsRepository.updateDraft(latest.id, this.toDraftUpdateInput(merged), tx);
        if (updated.count !== 1) throw new BadRequestException('Job draft could not be updated');

        if (dto.skills !== undefined) await this.replaceSkills(latest.id, dto.skills, tx);

        const version = await this.jobVersionsRepository.findByIdWithSkills(latest.id, tx);
        if (!version) throw new NotFoundException('Job version not found');

        return { job, version, createdNewVersion: false };
      }

      if (latest.versionStatus !== 'PUBLISHED') {
        throw new BadRequestException(`Unsupported job version status: ${latest.versionStatus}`);
      }

      const merged = this.mergeVersion(latest, dto);
      this.validateMergedRanges(merged);

      const versionNo = await this.jobVersionsRepository.getNextVersionNo(job.id, tx);

      const version = await this.jobVersionsRepository.create({
        jobId: job.id,
        versionNo,
        title: merged.title,
        summary: merged.summary,
        description: merged.description,
        responsibilities: merged.responsibilities,
        benefits: merged.benefits,
        employmentType: merged.employmentType,
        workplaceType: merged.workplaceType,
        experienceMinMonths: merged.experienceMinMonths,
        experienceMaxMonths: merged.experienceMaxMonths,
        salaryMin: merged.salaryMin,
        salaryMax: merged.salaryMax,
        salaryCurrency: merged.salaryCurrency,
        createdByUserId: userId,
      }, tx);

      if (dto.skills !== undefined) {
        await this.replaceSkills(version.id, dto.skills, tx);
      } else {
        const previousSkills = await this.jobVersionSkillsRepository.findByJobVersionId(latest.id, tx);

        await this.jobVersionSkillsRepository.createMany(previousSkills.map((item) => ({
          jobVersionId: version.id,
          skillId: item.skillId,
          importance: item.importance,
          isRequired: item.isRequired,
          weight: item.weight,
          minExperienceMonths: item.minExperienceMonths,
        })), tx);
      }

      const created = await this.jobVersionsRepository.findByIdWithSkills(version.id, tx);
      if (!created) throw new NotFoundException('Job version not found');

      return { job, version: created, createdNewVersion: true };
    });
  }

  async pause(companyId: string, jobId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.requireManageMembership(companyId, userId, tx);

      const locked = await this.jobsRepository.lockActiveOwnedById(jobId, companyId, tx);
      if (!locked) throw new NotFoundException('Job not found');

      const job = await this.jobsRepository.findActiveOwnedById(jobId, companyId, tx);
      if (!job) throw new NotFoundException('Job not found');
      if (job.status !== 'PUBLISHED') throw new BadRequestException('Only a published job can be paused');

      const updated = await this.jobsRepository.pausePublished(job.id, tx);
      if (updated.count !== 1) throw new BadRequestException('Job could not be paused');

      const result = await this.jobsRepository.findActiveOwnedById(job.id, companyId, tx);
      if (!result) throw new NotFoundException('Job not found');
      return result;
    });
  }

  async close(companyId: string, jobId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.requireManageMembership(companyId, userId, tx);

      const locked = await this.jobsRepository.lockActiveOwnedById(jobId, companyId, tx);
      if (!locked) throw new NotFoundException('Job not found');

      const job = await this.jobsRepository.findActiveOwnedById(jobId, companyId, tx);
      if (!job) throw new NotFoundException('Job not found');

      if (job.status !== 'PUBLISHED' && job.status !== 'PAUSED') {
        throw new BadRequestException('Only a published or paused job can be closed');
      }

      const closedAt = new Date();
      const updated = await this.jobsRepository.closePublishedOrPaused(job.id, closedAt, tx);
      if (updated.count !== 1) throw new BadRequestException('Job could not be closed');

      const result = await this.jobsRepository.findActiveOwnedById(job.id, companyId, tx);
      if (!result) throw new NotFoundException('Job not found');
      return result;
    });
  }

  async reopen(companyId: string, jobId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.requireManageMembership(companyId, userId, tx);

      const locked = await this.jobsRepository.lockActiveOwnedById(jobId, companyId, tx);
      if (!locked) throw new NotFoundException('Job not found');

      const job = await this.jobsRepository.findActiveOwnedById(jobId, companyId, tx);
      if (!job) throw new NotFoundException('Job not found');

      if (job.status !== 'PAUSED' && job.status !== 'CLOSED') {
        throw new BadRequestException('Only a paused or closed job can be reopened');
      }

      if (!job.currentPublishedVersionId) {
        throw new BadRequestException('Job has no published version to reopen');
      }

      const updated = await this.jobsRepository.reopenPausedOrClosed(job.id, tx);
      if (updated.count !== 1) throw new BadRequestException('Job could not be reopened');

      const result = await this.jobsRepository.findActiveOwnedById(job.id, companyId, tx);
      if (!result) throw new NotFoundException('Job not found');
      return result;
    });
  }

  async publish(companyId: string, jobId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.requireManageMembership(companyId, userId, tx);

      const locked = await this.jobsRepository.lockActiveOwnedById(jobId, companyId, tx);
      if (!locked) throw new NotFoundException('Job not found');

      const job = await this.jobsRepository.findActiveOwnedById(jobId, companyId, tx);
      if (!job) throw new NotFoundException('Job not found');
      if (job.status === 'ARCHIVED') throw new BadRequestException('Archived job cannot be published');
      if (job.status === 'CLOSED') throw new BadRequestException('Closed job must be reopened before publishing');

      const draft = await this.jobVersionsRepository.findLatestDraftByJobId(job.id, tx);
      if (!draft) throw new BadRequestException('Job has no draft version to publish');

      const latest = await this.jobVersionsRepository.findLatestByJobId(job.id, tx);
      if (!latest || latest.id !== draft.id) throw new BadRequestException('Only the latest job version can be published');

      this.validatePublishableVersion(draft);

      const publishedAt = new Date();
      const published = await this.jobVersionsRepository.publishDraft(draft.id, publishedAt, tx);
      if (published.count !== 1) throw new BadRequestException('Job version is no longer publishable');

      const updatedJob = await this.jobsRepository.publish(
        job.id,
        draft.id,
        publishedAt,
        job.firstPublishedAt ?? publishedAt,
        tx,
      );

      const version = await this.jobVersionsRepository.findByIdWithSkills(draft.id, tx);
      if (!version) throw new NotFoundException('Published job version not found');

      return { job: updatedJob, version };
    });
  }

  async listManaged(companyId: string, userId: string) {
    await this.requireViewMembership(companyId, userId);

    const jobs = await this.jobsRepository.findByCompanyId(companyId);
    if (jobs.length === 0) return [];

    const jobIds = jobs.map((job) => job.id);
    const publishedVersionIds = jobs.flatMap((job) => job.currentPublishedVersionId ? [job.currentPublishedVersionId] : []);

    const [drafts, publishedVersions] = await Promise.all([
      this.jobVersionsRepository.findDraftsByJobIds(jobIds),
      this.jobVersionsRepository.findByIds(publishedVersionIds),
    ]);

    const latestDraftByJobId = new Map<string, (typeof drafts)[number]>();

    for (const draft of drafts) {
      if (!latestDraftByJobId.has(draft.jobId)) latestDraftByJobId.set(draft.jobId, draft);
    }

    const publishedById = new Map(publishedVersions.map((version) => [version.id, version] as const));

    return jobs.map((job) => ({
      job,
      currentDraftVersion: latestDraftByJobId.get(job.id) ?? null,
      currentPublishedVersion: job.currentPublishedVersionId ? publishedById.get(job.currentPublishedVersionId) ?? null : null,
    }));
  }

  async getManagedDetail(companyId: string, jobId: string, userId: string) {
    await this.requireViewMembership(companyId, userId);

    const job = await this.jobsRepository.findActiveOwnedById(jobId, companyId);
    if (!job) throw new NotFoundException('Job not found');

    const [versions, currentDraftVersion, currentPublishedVersion] = await Promise.all([
      this.jobVersionsRepository.findByJobId(job.id),
      this.jobVersionsRepository.findLatestDraftByJobIdWithSkills(job.id),
      job.currentPublishedVersionId
        ? this.jobVersionsRepository.findByJobAndIdWithSkills(job.id, job.currentPublishedVersionId)
        : Promise.resolve(null),
    ]);

    return { job, versions, currentDraftVersion, currentPublishedVersion };
  }

  async archive(companyId: string, jobId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.requireManageMembership(companyId, userId, tx);

      const locked = await this.jobsRepository.lockActiveOwnedById(jobId, companyId, tx);
      if (!locked) throw new NotFoundException('Job not found');

      const job = await this.jobsRepository.findActiveOwnedById(jobId, companyId, tx);
      if (!job) throw new NotFoundException('Job not found');

      if (job.status !== 'DRAFT' && job.status !== 'CLOSED') {
        throw new BadRequestException('Only a draft or closed job can be archived');
      }

      const updated = await this.jobsRepository.archiveDraftOrClosed(job.id, tx);
      if (updated.count !== 1) throw new BadRequestException('Job could not be archived');

      const result = await this.jobsRepository.findActiveOwnedById(job.id, companyId, tx);
      if (!result) throw new NotFoundException('Job not found');

      return result;
    });
  }

  async delete(companyId: string, jobId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.requireManageMembership(companyId, userId, tx);

      const locked = await this.jobsRepository.lockActiveOwnedById(jobId, companyId, tx);
      if (!locked) throw new NotFoundException('Job not found');

      const job = await this.jobsRepository.findActiveOwnedById(jobId, companyId, tx);
      if (!job) throw new NotFoundException('Job not found');

      if (!['DRAFT', 'CLOSED', 'ARCHIVED'].includes(job.status)) {
        throw new BadRequestException('Published or paused job must be closed before deletion');
      }

      const deletedAt = new Date();
      const deleted = await this.jobsRepository.softDeleteDraftClosedOrArchived(job.id, deletedAt, tx);
      if (deleted.count !== 1) throw new BadRequestException('Job could not be deleted');

      return {
        id: job.id,
        status: 'ARCHIVED',
        deletedAt,
      };
    });
  }

  private async requireManageMembership(companyId: string, userId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const membership = await this.membershipsRepository.findByCompanyAndUser(companyId, userId, tx);

    if (!membership || membership.status !== 'ACTIVE' || !JOB_MANAGE_MEMBERSHIP_ROLES.has(membership.role)) {
      throw new ForbiddenException('You do not have permission to manage jobs for this company');
    }
  }

  private validateDuplicateSkills(skillIds: string[]): void {
    if (new Set(skillIds).size !== skillIds.length) throw new BadRequestException('Duplicate skills are not allowed');
  }

  private validateRanges(dto: CreateJobDto): void {
    const experienceMin = dto.experienceMinMonths;
    const experienceMax = dto.experienceMaxMonths;

    if (experienceMin != null && experienceMax != null && experienceMax < experienceMin) {
      throw new BadRequestException('experienceMaxMonths must be greater than or equal to experienceMinMonths');
    }

    if (dto.salaryMin != null && dto.salaryMax != null) {
      const salaryMin = new Prisma.Decimal(dto.salaryMin);
      const salaryMax = new Prisma.Decimal(dto.salaryMax);
      if (salaryMax.lessThan(salaryMin)) throw new BadRequestException('salaryMax must be greater than or equal to salaryMin');
    }

    if ((dto.salaryMin != null || dto.salaryMax != null) && !dto.salaryCurrency) {
      throw new BadRequestException('salaryCurrency is required when salary range is provided');
    }
  }

  private async replaceSkills(jobVersionId: string, skills: CreateJobSkillDto[], tx: Prisma.TransactionClient): Promise<void> {
    await this.jobVersionSkillsRepository.deleteByJobVersionId(jobVersionId, tx);

    await this.jobVersionSkillsRepository.createMany(skills.map((skill) => ({
      jobVersionId,
      skillId: skill.skillId,
      importance: skill.importance ?? 3,
      isRequired: skill.isRequired ?? true,
      weight: new Prisma.Decimal(skill.weight ?? '1'),
      minExperienceMonths: skill.minExperienceMonths ?? null,
    })), tx);
  }

  private mergeVersion(current: JobVersion, dto: UpdateJobDto): EditableJobVersion {
    return {
      title: dto.title ?? current.title,
      summary: dto.summary !== undefined ? dto.summary : current.summary,
      description: dto.description ?? current.description,
      responsibilities: dto.responsibilities !== undefined ? dto.responsibilities : current.responsibilities,
      benefits: dto.benefits !== undefined ? dto.benefits : current.benefits,
      employmentType: dto.employmentType !== undefined ? dto.employmentType : current.employmentType,
      workplaceType: dto.workplaceType !== undefined ? dto.workplaceType : current.workplaceType,
      experienceMinMonths: dto.experienceMinMonths !== undefined ? dto.experienceMinMonths : current.experienceMinMonths,
      experienceMaxMonths: dto.experienceMaxMonths !== undefined ? dto.experienceMaxMonths : current.experienceMaxMonths,
      salaryMin: dto.salaryMin !== undefined ? dto.salaryMin === null ? null : new Prisma.Decimal(dto.salaryMin) : current.salaryMin,
      salaryMax: dto.salaryMax !== undefined ? dto.salaryMax === null ? null : new Prisma.Decimal(dto.salaryMax) : current.salaryMax,
      salaryCurrency: dto.salaryCurrency !== undefined ? dto.salaryCurrency : current.salaryCurrency,
    };
  }

  private async validateSkills(skills: CreateJobSkillDto[], tx?: Prisma.TransactionClient): Promise<void> {
    if (skills.length === 0) return;

    const ids = skills.map((skill) => skill.skillId);
    const activeIds = await this.jobVersionSkillsRepository.findActiveSkillIds(ids, tx);

    if (activeIds.length !== ids.length) {
      throw new BadRequestException('One or more job skills do not exist or are inactive');
    }
  }

  private validateMergedRanges(version: EditableJobVersion): void {
    if (version.experienceMinMonths != null && version.experienceMaxMonths != null && version.experienceMaxMonths < version.experienceMinMonths) {
      throw new BadRequestException('experienceMaxMonths must be greater than or equal to experienceMinMonths');
    }

    if (version.salaryMin != null && version.salaryMax != null && version.salaryMax.lessThan(version.salaryMin)) {
      throw new BadRequestException('salaryMax must be greater than or equal to salaryMin');
    }

    if ((version.salaryMin != null || version.salaryMax != null) && !version.salaryCurrency) {
      throw new BadRequestException('salaryCurrency is required when salary range is provided');
    }
  }

  private toDraftUpdateInput(version: EditableJobVersion) {
    return {
      title: version.title,
      summary: version.summary,
      description: version.description,
      responsibilities: version.responsibilities,
      benefits: version.benefits,
      employmentType: version.employmentType,
      workplaceType: version.workplaceType,
      experienceMinMonths: version.experienceMinMonths,
      experienceMaxMonths: version.experienceMaxMonths,
      salaryMin: version.salaryMin,
      salaryMax: version.salaryMax,
      salaryCurrency: version.salaryCurrency,
    };
  }

  private validatePublishableVersion(version: {
    title: string;
    description: string;
    experienceMinMonths: number | null;
    experienceMaxMonths: number | null;
    salaryMin: Prisma.Decimal | null;
    salaryMax: Prisma.Decimal | null;
    salaryCurrency: string | null;
  }): void {
    if (!version.title.trim()) throw new BadRequestException('Job title is required before publishing');
    if (!version.description.trim()) throw new BadRequestException('Job description is required before publishing');
    this.validateMergedRanges({
      title: version.title,
      summary: null,
      description: version.description,
      responsibilities: null,
      benefits: null,
      employmentType: null,
      workplaceType: null,
      experienceMinMonths: version.experienceMinMonths,
      experienceMaxMonths: version.experienceMaxMonths,
      salaryMin: version.salaryMin,
      salaryMax: version.salaryMax,
      salaryCurrency: version.salaryCurrency,
    });
  }

  private async requireViewMembership(companyId: string, userId: string): Promise<void> {
    const membership = await this.membershipsRepository.findByCompanyAndUser(companyId, userId);

    if (!membership || membership.status !== 'ACTIVE' || !JOB_VIEW_MEMBERSHIP_ROLES.has(membership.role)) {
      throw new ForbiddenException('You do not have permission to view jobs for this company');
    }
  }

  private validateUpdatePayload(dto: UpdateJobDto): void {
    if (Object.keys(dto).length === 0) throw new BadRequestException('At least one job field must be provided');
  }
}