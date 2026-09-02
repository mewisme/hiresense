import type { Prisma } from '../../../generated/prisma/client';

type PublicJob = Prisma.JobGetPayload<{ include: { company: true } }>;
type PublicJobVersion = Prisma.JobVersionGetPayload<{
  include: {
    skills: {
      include: { skill: true };
    };
  };
}>;

export function toPublicJobResponse(job: PublicJob, version: PublicJobVersion) {
  return {
    id: job.id,
    slug: job.slug,
    status: job.status,
    firstPublishedAt: job.firstPublishedAt,
    company: {
      id: job.company.id,
      name: job.company.name,
      slug: job.company.slug,
      description: job.company.description,
      websiteUrl: job.company.websiteUrl,
    },
    version: {
      id: version.id,
      versionNo: version.versionNo,
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
      publishedAt: version.publishedAt,
      skills: version.skills.map((item) => ({
        skillId: item.skillId,
        name: item.skill.name,
        importance: item.importance,
        isRequired: item.isRequired,
        weight: item.weight.toString(),
        minExperienceMonths: item.minExperienceMonths,
      })),
    },
  };
}