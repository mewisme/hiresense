import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { isPrismaUniqueConstraintError } from '../../common/utils/prisma-error.util';
import { ApplyJobDto } from './dto/apply-job.dto';
import { ApplicationCandidatesRepository } from './repositories/application-candidates.repository';
import { ApplicationJobsRepository } from './repositories/application-jobs.repository';
import { ApplicationStageHistoryRepository } from './repositories/application-stage-history.repository';
import { ApplicationsRepository } from './repositories/applications.repository';
import { RecruitmentStagesRepository } from './repositories/recruitment-stages.repository';
import { RecruiterApplicationsQueryDto } from './dto/recruiter-applications-query.dto';
import { ApplicationCompanyMembershipsRepository } from './repositories/application-company-memberships.repository';

const APPLICATION_VIEW_MEMBERSHIP_ROLES = new Set(['OWNER', 'ADMIN', 'RECRUITER', 'REVIEWER']);

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
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

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;
    const repositoryQuery = {
      stageId: query.stageId,
      skip,
      take: limit,
    };

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

  async getForRecruiter(companyId: string, applicationId: string, userId: string) {
    await this.requireCompanyViewMembership(companyId, userId);

    const application = await this.applicationsRepository.findRecruiterOwnedByIdWithDetail(applicationId, companyId);
    if (!application) throw new NotFoundException('Application not found');

    const history = await this.applicationStageHistoryRepository.findByApplicationId(application.id);

    return { application, history };
  }

  private async requireCompanyViewMembership(companyId: string, userId: string) {
    const membership = await this.applicationCompanyMembershipsRepository.findByCompanyAndUser(companyId, userId);

    if (!membership || membership.status !== 'ACTIVE' || !APPLICATION_VIEW_MEMBERSHIP_ROLES.has(membership.role)) {
      throw new ForbiddenException('You do not have access to company applications');
    }

    return membership;
  }
}