import { Prisma } from '../../../generated/prisma/client';

type RecruiterApplicationListItem = Prisma.ApplicationGetPayload<{
  include: {
    candidateProfile: true;
    resumeVersion: { include: { resume: true } };
    currentStage: true;
    jobVersion: true;
  };
}>;

type RecruiterApplicationDetail = Prisma.ApplicationGetPayload<{
  include: {
    candidateProfile: true;
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

type RecruiterApplicationHistory = Prisma.ApplicationStageHistoryGetPayload<{
  include: {
    fromStage: true;
    toStage: true;
    changedBy: { select: { id: true; email: true } };
  };
}>;

function toStageResponse(stage: RecruiterApplicationListItem['currentStage']) {
  return {
    id: stage.id,
    code: stage.code,
    name: stage.name,
    ordinal: stage.ordinal,
    isTerminal: stage.isTerminal,
    terminalOutcome: stage.terminalOutcome,
  };
}

export function toRecruiterApplicationListItemResponse(application: RecruiterApplicationListItem) {
  return {
    id: application.id,
    jobId: application.jobId,
    jobVersionId: application.jobVersionId,
    resumeVersionId: application.resumeVersionId,
    source: application.source,
    appliedAt: application.appliedAt,
    withdrawnAt: application.withdrawnAt,
    currentStage: toStageResponse(application.currentStage),
    candidate: {
      id: application.candidateProfile.id,
      fullName: application.candidateProfile.fullName,
      headline: application.candidateProfile.headline,
      city: application.candidateProfile.city,
      region: application.candidateProfile.region,
      countryCode: application.candidateProfile.countryCode,
      experienceMonthsDeclared: application.candidateProfile.experienceMonthsDeclared,
    },
    jobVersion: {
      id: application.jobVersion.id,
      versionNo: application.jobVersion.versionNo,
      title: application.jobVersion.title,
    },
    resumeVersion: {
      id: application.resumeVersion.id,
      versionNo: application.resumeVersion.versionNo,
      resume: {
        id: application.resumeVersion.resume.id,
        name: application.resumeVersion.resume.name,
      },
    },
  };
}

export function toRecruiterApplicationDetailResponse(application: RecruiterApplicationDetail, history: RecruiterApplicationHistory[]) {
  return {
    id: application.id,
    jobId: application.jobId,
    jobVersionId: application.jobVersionId,
    resumeVersionId: application.resumeVersionId,
    source: application.source,
    coverLetter: application.coverLetter,
    appliedAt: application.appliedAt,
    withdrawnAt: application.withdrawnAt,
    currentStage: toStageResponse(application.currentStage),
    candidate: {
      id: application.candidateProfile.id,
      fullName: application.candidateProfile.fullName,
      phone: application.candidateProfile.phone,
      headline: application.candidateProfile.headline,
      summary: application.candidateProfile.summary,
      city: application.candidateProfile.city,
      region: application.candidateProfile.region,
      countryCode: application.candidateProfile.countryCode,
      timezone: application.candidateProfile.timezone,
      experienceMonthsDeclared: application.candidateProfile.experienceMonthsDeclared,
      portfolioUrl: application.candidateProfile.portfolioUrl,
      githubUrl: application.candidateProfile.githubUrl,
      linkedinUrl: application.candidateProfile.linkedinUrl,
    },
    company: {
      id: application.job.company.id,
      name: application.job.company.name,
      slug: application.job.company.slug,
    },
    job: {
      id: application.job.id,
      slug: application.job.slug,
      status: application.job.status,
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
      educationMinLevel: application.jobVersion.educationMinLevel,
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
      changedBy: item.changedBy ? {
        id: item.changedBy.id,
        email: item.changedBy.email,
      } : null,
      note: item.note,
      createdAt: item.createdAt,
    })),
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
}