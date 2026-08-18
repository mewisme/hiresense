import { Prisma } from '../../../generated/prisma/client';

type CandidateApplicationListItem = Prisma.ApplicationGetPayload<{
  include: {
    job: { include: { company: true } };
    jobVersion: true;
    currentStage: true;
  };
}>;

type CandidateApplicationDetail = Prisma.ApplicationGetPayload<{
  include: {
    job: { include: { company: true } };
    jobVersion: {
      include: {
        skills: { include: { skill: true } };
      };
    };
    resumeVersion: { include: { resume: true } };
    currentStage: true;
  };
}>;

type CandidateStageHistory = Prisma.ApplicationStageHistoryGetPayload<{
  include: {
    fromStage: true;
    toStage: true;
  };
}>;

function toStageResponse(stage: CandidateApplicationListItem['currentStage']) {
  return {
    id: stage.id,
    code: stage.code,
    name: stage.name,
    ordinal: stage.ordinal,
    isTerminal: stage.isTerminal,
    terminalOutcome: stage.terminalOutcome,
  };
}

function toCompanyResponse(company: CandidateApplicationListItem['job']['company']) {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    description: company.description,
    websiteUrl: company.websiteUrl,
  };
}

export function toCandidateApplicationListItemResponse(application: CandidateApplicationListItem) {
  return {
    id: application.id,
    jobId: application.jobId,
    jobVersionId: application.jobVersionId,
    resumeVersionId: application.resumeVersionId,
    source: application.source,
    appliedAt: application.appliedAt,
    withdrawnAt: application.withdrawnAt,
    currentStage: toStageResponse(application.currentStage),
    job: {
      id: application.job.id,
      slug: application.job.slug,
      status: application.job.status,
      company: toCompanyResponse(application.job.company),
    },
    jobVersion: {
      id: application.jobVersion.id,
      versionNo: application.jobVersion.versionNo,
      title: application.jobVersion.title,
      summary: application.jobVersion.summary,
      employmentType: application.jobVersion.employmentType,
      workplaceType: application.jobVersion.workplaceType,
    },
  };
}

export function toCandidateApplicationDetailResponse(application: CandidateApplicationDetail, history: CandidateStageHistory[]) {
  return {
    id: application.id,
    jobId: application.jobId,
    jobVersionId: application.jobVersionId,
    candidateProfileId: application.candidateProfileId,
    resumeVersionId: application.resumeVersionId,
    source: application.source,
    coverLetter: application.coverLetter,
    appliedAt: application.appliedAt,
    withdrawnAt: application.withdrawnAt,
    currentStage: toStageResponse(application.currentStage),
    job: {
      id: application.job.id,
      slug: application.job.slug,
      status: application.job.status,
      company: toCompanyResponse(application.job.company),
    },
    jobVersion: {
      id: application.jobVersion.id,
      versionNo: application.jobVersion.versionNo,
      versionStatus: application.jobVersion.versionStatus,
      title: application.jobVersion.title,
      summary: application.jobVersion.summary,
      description: application.jobVersion.description,
      responsibilities: application.jobVersion.responsibilities,
      benefits: application.jobVersion.benefits,
      employmentType: application.jobVersion.employmentType,
      workplaceType: application.jobVersion.workplaceType,
      experienceMinMonths: application.jobVersion.experienceMinMonths,
      experienceMaxMonths: application.jobVersion.experienceMaxMonths,
      salaryMin: application.jobVersion.salaryMin?.toString() ?? null,
      salaryMax: application.jobVersion.salaryMax?.toString() ?? null,
      salaryCurrency: application.jobVersion.salaryCurrency,
      publishedAt: application.jobVersion.publishedAt,
      skills: application.jobVersion.skills.map((item) => ({
        skillId: item.skillId,
        name: item.skill.name,
        importance: item.importance,
        isRequired: item.isRequired,
        weight: item.weight.toString(),
        minExperienceMonths: item.minExperienceMonths,
      })),
    },
    resumeVersion: {
      id: application.resumeVersion.id,
      versionNo: application.resumeVersion.versionNo,
      resume: {
        id: application.resumeVersion.resume.id,
        name: application.resumeVersion.resume.name,
      },
    },
    history: history.map((item) => ({
      id: item.id,
      fromStage: item.fromStage ? {
        id: item.fromStage.id,
        code: item.fromStage.code,
        name: item.fromStage.name,
      } : null,
      toStage: {
        id: item.toStage.id,
        code: item.toStage.code,
        name: item.toStage.name,
      },
      createdAt: item.createdAt,
    })),
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
}