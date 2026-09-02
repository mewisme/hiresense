import type { Job, JobVersion, Prisma } from '../../../generated/prisma/client';

type JobVersionWithSkills = Prisma.JobVersionGetPayload<{
  include: {
    skills: {
      include: { skill: true };
    };
  };
}>;

export function toJobResponse(job: Job) {
  return {
    id: job.id,
    companyId: job.companyId,
    createdByUserId: job.createdByUserId,
    slug: job.slug,
    status: job.status,
    currentPublishedVersionId: job.currentPublishedVersionId,
    firstPublishedAt: job.firstPublishedAt,
    closedAt: job.closedAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export function toJobVersionResponse(version: JobVersion | null) {
  if (!version) return null;

  return {
    id: version.id,
    jobId: version.jobId,
    versionNo: version.versionNo,
    versionStatus: version.versionStatus,
    title: version.title,
    summary: version.summary,
    description: version.description,
    responsibilities: version.responsibilities,
    benefits: version.benefits,
    employmentType: version.employmentType,
    workplaceType: version.workplaceType,
    experienceMinMonths: version.experienceMinMonths,
    experienceMaxMonths: version.experienceMaxMonths,
    educationMinLevel: version.educationMinLevel,
    salaryMin: version.salaryMin?.toString() ?? null,
    salaryMax: version.salaryMax?.toString() ?? null,
    salaryCurrency: version.salaryCurrency,
    createdByUserId: version.createdByUserId,
    publishedAt: version.publishedAt,
    createdAt: version.createdAt,
  };
}

export function toJobVersionWithSkillsResponse(version: JobVersionWithSkills | null) {
  if (!version) return null;

  return {
    ...toJobVersionResponse(version),
    skills: version.skills.map((item) => ({
      id: item.id,
      skillId: item.skillId,
      name: item.skill.name,
      importance: item.importance,
      isRequired: item.isRequired,
      weight: item.weight.toString(),
      minExperienceMonths: item.minExperienceMonths,
    })),
  };
}