interface DecimalLike {
  toString(): string;
}

type ConfidenceSource = number | DecimalLike | null;

interface ResumeParseStatusSource {
  id: string;
  resumeVersionId: string;
  status: string;
  rawText?: string | null;
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
  skills?: Array<{
    confidence: ConfidenceSource;
    evidenceText: string | null;
    skill: {
      id: string;
      name: string;
      normalizedName: string;
    };
  }>;
  experiences?: Array<{
    companyName: string | null;
    jobTitle: string | null;
    startDate: Date | null;
    endDate: Date | null;
    isCurrent: boolean;
    description: string | null;
    experienceMonths: number | null;
    ordinal: number;
    confidence: ConfidenceSource;
  }>;
  educations?: Array<{
    institutionName: string | null;
    degree: string | null;
    fieldOfStudy: string | null;
    startDate: Date | null;
    endDate: Date | null;
    description: string | null;
    ordinal: number;
    confidence: ConfidenceSource;
  }>;
}

export function toResumeParseStatusResponse(run: ResumeParseStatusSource, reused = false) {
  const response = {
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

  if (run.status !== 'SUCCEEDED' || run.rawText === undefined) {
    return { ...response, result: null };
  }

  return {
    ...response,
    result: {
      rawText: run.rawText,
      skills: (run.skills ?? []).map((item) => ({
        id: item.skill.id,
        name: item.skill.name,
        normalizedName: item.skill.normalizedName,
        confidence: toNumber(item.confidence),
        evidenceText: item.evidenceText,
      })),
      experiences: (run.experiences ?? []).map((item) => ({
        companyName: item.companyName,
        jobTitle: item.jobTitle,
        startDate: toDateOnly(item.startDate),
        endDate: toDateOnly(item.endDate),
        isCurrent: item.isCurrent,
        description: item.description,
        experienceMonths: item.experienceMonths,
        ordinal: item.ordinal,
        confidence: toNumber(item.confidence),
      })),
      educations: (run.educations ?? []).map((item) => ({
        institutionName: item.institutionName,
        degree: item.degree,
        fieldOfStudy: item.fieldOfStudy,
        startDate: toDateOnly(item.startDate),
        endDate: toDateOnly(item.endDate),
        description: item.description,
        ordinal: item.ordinal,
        confidence: toNumber(item.confidence),
      })),
    },
  };
}

function toNumber(value: ConfidenceSource): number | null {
  return value === null ? null : Number(value.toString());
}

function toDateOnly(value: Date | null): string | null {
  return value?.toISOString().slice(0, 10) ?? null;
}