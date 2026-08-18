import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { isPrismaUniqueConstraintError } from '../../common/utils/prisma-error.util';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { FileStorageService } from '../files/file-storage.service';
import { ApplyJobDto } from './dto/apply-job.dto';
import { ChangeApplicationStageDto } from './dto/change-application-stage.dto';
import { RecruiterApplicationsQueryDto } from './dto/recruiter-applications-query.dto';
import { ApplicationCandidatesRepository } from './repositories/application-candidates.repository';
import { ApplicationCompanyMembershipsRepository } from './repositories/application-company-memberships.repository';
import { ApplicationJobsRepository } from './repositories/application-jobs.repository';
import { ApplicationStageHistoryRepository } from './repositories/application-stage-history.repository';
import { ApplicationsRepository } from './repositories/applications.repository';
import { RecruitmentStagesRepository } from './repositories/recruitment-stages.repository';
import { isSystemRecruitmentStageCode } from './types/recruitment-stage.type';
import { canRecruiterTransitionApplicationStage } from './utils/application-stage-transition.util';

const APPLICATION_VIEW_MEMBERSHIP_ROLES = new Set(['OWNER', 'ADMIN', 'RECRUITER', 'REVIEWER']);
const APPLICATION_MANAGE_MEMBERSHIP_ROLES = new Set(['OWNER', 'ADMIN', 'RECRUITER']);

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorageService: FileStorageService,
    private readonly applicationCompanyMembershipsRepository: ApplicationCompanyMembershipsRepository,
    private readonly applicationsRepository: ApplicationsRepository,
    private readonly recruitmentStagesRepository: RecruitmentStagesRepository,
    private readonly applicationStageHistoryRepository: ApplicationStageHistoryRepository,
    private readonly applicationCandidatesRepository: ApplicationCandidatesRepository,
    private readonly applicationJobsRepository: ApplicationJobsRepository,
  ) { }

  async apply(jobId: string, userId: string, dto: ApplyJobDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const candidateProfile = await this.applicationCandidatesRepository.findProfileByUserId(userId, tx);
        if (!candidateProfile) throw new NotFoundException('Candidate profile not found');

        const job = await this.applicationJobsRepository.lockPublishedById(jobId, tx);
        if (!job) throw new NotFoundException('Job is not available for applications');

        const resumeOwned = await this.applicationCandidatesRepository.lockOwnedResumeVersion(candidateProfile.id, dto.resumeVersionId, tx);
        if (!resumeOwned) throw new NotFoundException('Resume version not found');

        const existing = await this.applicationsRepository.findByJobAndCandidate(job.id, candidateProfile.id, tx);
        if (existing) throw new ConflictException('You have already applied to this job');

        const appliedStage = await this.recruitmentStagesRepository.findActiveSystemByCode('APPLIED', tx);
        if (!appliedStage) throw new InternalServerErrorException('System APPLIED recruitment stage is not configured');

        const application = await this.applicationsRepository.create({
          jobId: job.id,
          jobVersionId: job.currentPublishedVersionId,
          candidateProfileId: candidateProfile.id,
          resumeVersionId: dto.resumeVersionId,
          currentStageId: appliedStage.id,
          source: 'DIRECT',
          coverLetter: dto.coverLetter ?? null,
        }, tx);

        await this.applicationStageHistoryRepository.create({
          applicationId: application.id,
          fromStageId: null,
          toStageId: appliedStage.id,
          changedByUserId: userId,
          note: null,
        }, tx);

        return { application, currentStage: appliedStage };
      });
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('You have already applied to this job');
      }

      throw error;
    }
  }

  async listMine(userId: string) {
    const candidateProfile = await this.applicationCandidatesRepository.findProfileByUserId(userId);
    if (!candidateProfile) throw new NotFoundException('Candidate profile not found');

    return this.applicationsRepository.findByCandidateProfileId(candidateProfile.id);
  }

  async getMine(applicationId: string, userId: string) {
    const candidateProfile = await this.applicationCandidatesRepository.findProfileByUserId(userId);
    if (!candidateProfile) throw new NotFoundException('Candidate profile not found');

    const application = await this.applicationsRepository.findCandidateOwnedByIdWithDetail(applicationId, candidateProfile.id);
    if (!application) throw new NotFoundException('Application not found');

    const history = await this.applicationStageHistoryRepository.findCandidateVisibleByApplicationId(application.id);

    return { application, history };
  }

  async withdraw(applicationId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const candidateProfile = await this.applicationCandidatesRepository.findProfileByUserId(userId, tx);
      if (!candidateProfile) throw new NotFoundException('Candidate profile not found');

      const locked = await this.applicationsRepository.lockCandidateOwnedById(applicationId, candidateProfile.id, tx);
      if (!locked) throw new NotFoundException('Application not found');

      const application = await this.applicationsRepository.findCandidateOwnedByIdWithStage(applicationId, candidateProfile.id, tx);
      if (!application) throw new NotFoundException('Application not found');

      if (application.withdrawnAt || application.currentStage.code === 'WITHDRAWN') {
        throw new ConflictException('Application has already been withdrawn');
      }

      if (application.currentStage.isTerminal) {
        throw new BadRequestException('Application can no longer be withdrawn');
      }

      const withdrawnStage = await this.recruitmentStagesRepository.findActiveSystemByCode('WITHDRAWN', tx);
      if (!withdrawnStage) throw new InternalServerErrorException('System WITHDRAWN recruitment stage is not configured');

      const withdrawnAt = new Date();
      const updated = await this.applicationsRepository.withdraw(application.id, withdrawnStage.id, withdrawnAt, tx);

      await this.applicationStageHistoryRepository.create({
        applicationId: application.id,
        fromStageId: application.currentStageId,
        toStageId: withdrawnStage.id,
        changedByUserId: userId,
        note: null,
      }, tx);

      return { application: updated, currentStage: withdrawnStage };
    });
  }

  async listForRecruiter(companyId: string, jobId: string, userId: string, query: RecruiterApplicationsQueryDto) {
    await this.requireCompanyViewMembership(companyId, userId);

    const job = await this.applicationJobsRepository.findCompanyJobById(jobId, companyId);
    if (!job) throw new NotFoundException('Job not found');

    if (query.stageId) {
      const stage = await this.recruitmentStagesRepository.findActiveForCompanyById(query.stageId, companyId);
      if (!stage) throw new BadRequestException('Recruitment stage is invalid or inactive');
    }

    const page = query.page;
    const limit = query.limit;
    const repositoryQuery = { stageId: query.stageId, skip: (page - 1) * limit, take: limit };

    const [items, total] = await Promise.all([
      this.applicationsRepository.findRecruiterApplications(jobId, companyId, repositoryQuery),
      this.applicationsRepository.countRecruiterApplications(jobId, companyId, repositoryQuery),
    ]);

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

  async changeStage(companyId: string, applicationId: string, userId: string, dto: ChangeApplicationStageDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.requireCompanyManageMembership(companyId, userId, tx);

      const locked = await this.applicationsRepository.lockRecruiterOwnedById(applicationId, companyId, tx);
      if (!locked) throw new NotFoundException('Application not found');

      const application = await this.applicationsRepository.findRecruiterOwnedByIdWithStage(applicationId, companyId, tx);
      if (!application) throw new NotFoundException('Application not found');

      if (!isSystemRecruitmentStageCode(application.currentStage.code)) {
        throw new BadRequestException('Unsupported current recruitment stage');
      }

      if (application.currentStage.isTerminal || application.currentStage.code === 'WITHDRAWN') {
        throw new ConflictException('Application is already in a terminal stage');
      }

      const targetStage = await this.recruitmentStagesRepository.findActiveSystemById(dto.stageId, tx);
      if (!targetStage) throw new BadRequestException('Target recruitment stage is invalid or inactive');

      if (!isSystemRecruitmentStageCode(targetStage.code)) {
        throw new BadRequestException('Unsupported target recruitment stage');
      }

      if (application.currentStageId === targetStage.id) {
        throw new ConflictException('Application is already in the requested stage');
      }

      if (targetStage.code === 'WITHDRAWN') {
        throw new BadRequestException('WITHDRAWN stage can only be set by the candidate');
      }

      if (!canRecruiterTransitionApplicationStage(application.currentStage.code, targetStage.code)) {
        throw new BadRequestException(`Invalid application stage transition: ${application.currentStage.code} -> ${targetStage.code}`);
      }

      const updated = await this.applicationsRepository.updateCurrentStage(application.id, targetStage.id, tx);

      await this.applicationStageHistoryRepository.create({
        applicationId: application.id,
        fromStageId: application.currentStageId,
        toStageId: targetStage.id,
        changedByUserId: userId,
        note: dto.note ?? null,
      }, tx);

      return { application: updated, currentStage: targetStage };
    });
  }

  async getForRecruiter(companyId: string, applicationId: string, userId: string) {
    await this.requireCompanyViewMembership(companyId, userId);

    const application = await this.applicationsRepository.findRecruiterOwnedByIdWithDetail(applicationId, companyId);
    if (!application) throw new NotFoundException('Application not found');

    const history = await this.applicationStageHistoryRepository.findByApplicationId(application.id);

    return { application, history };
  }

  async openRecruiterResume(companyId: string, applicationId: string, userId: string) {
    await this.requireCompanyViewMembership(companyId, userId);

    const target = await this.applicationsRepository.findRecruiterResumeTarget(applicationId, companyId);
    if (!target) throw new NotFoundException('Application not found');

    const stored = await this.fileStorageService.open(target.resumeVersion.fileObjectId);

    return {
      applicationId: target.id,
      resumeVersion: target.resumeVersion,
      ...stored,
    };
  }

  private async requireCompanyViewMembership(companyId: string, userId: string) {
    const membership = await this.applicationCompanyMembershipsRepository.findByCompanyAndUser(companyId, userId);

    if (!membership || membership.status !== 'ACTIVE' || !APPLICATION_VIEW_MEMBERSHIP_ROLES.has(membership.role)) {
      throw new ForbiddenException('You do not have access to company applications');
    }

    return membership;
  }

  private async requireCompanyManageMembership(companyId: string, userId: string, tx?: Prisma.TransactionClient) {
    const membership = await this.applicationCompanyMembershipsRepository.findByCompanyAndUser(companyId, userId, tx);

    if (!membership || membership.status !== 'ACTIVE' || !APPLICATION_MANAGE_MEMBERSHIP_ROLES.has(membership.role)) {
      throw new ForbiddenException('You do not have permission to manage company applications');
    }

    return membership;
  }
}