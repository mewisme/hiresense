import type { Application, RecruitmentStage } from '../../../generated/prisma/client';

export function toApplicationResponse(application: Application, currentStage: RecruitmentStage) {
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
    currentStage: {
      id: currentStage.id,
      code: currentStage.code,
      name: currentStage.name,
      ordinal: currentStage.ordinal,
      isTerminal: currentStage.isTerminal,
      terminalOutcome: currentStage.terminalOutcome,
    },
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
}