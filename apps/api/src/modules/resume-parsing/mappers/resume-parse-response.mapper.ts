interface ResumeParseStatusSource {
  id: string;
  resumeVersionId: string;
  status: string;
  detectedLanguage: string | null;
  warnings: unknown;
  startedAt: Date | null;
  completedAt: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
  pipelineVersion: {
    id: string;
    code: string;
    semanticVersion: string;
  };
}

export function toResumeParseStatusResponse(run: ResumeParseStatusSource, reused = false) {
  return {
    id: run.id,
    resumeVersionId: run.resumeVersionId,
    status: run.status,
    pipeline: {
      id: run.pipelineVersion.id,
      code: run.pipelineVersion.code,
      semanticVersion: run.pipelineVersion.semanticVersion,
    },
    detectedLanguage: run.detectedLanguage,
    warnings: run.warnings,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    errorCode: run.errorCode,
    errorMessage: run.errorMessage,
    createdAt: run.createdAt,
    reused,
  };
}