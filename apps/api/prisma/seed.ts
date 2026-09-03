import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { PrismaClient, type Prisma } from '../src/generated/prisma/client';

export const DEMO_PASSWORD =
  process.env.HIRESENSE_DEMO_PASSWORD ?? 'HireSenseDemo123!';
export const DEMO_CANDIDATE_EMAIL = 'candidate.demo@hiresense.local';
export const DEMO_RECRUITER_EMAIL = 'recruiter.demo@hiresense.local';

export const DEMO_IDS = {
  candidateUser: '0199a000-0000-7000-8000-000000000001',
  recruiterUser: '0199a000-0000-7000-8000-000000000002',
  candidateProfile: '0199a000-0000-7000-8000-000000000003',
  recruiterProfile: '0199a000-0000-7000-8000-000000000004',
  company: '0199a000-0000-7000-8000-000000000005',
  membership: '0199a000-0000-7000-8000-000000000006',
  resume: '0199a000-0000-7000-8000-000000000007',
  fileObject: '0199a000-0000-7000-8000-000000000008',
  resumeVersion: '0199a000-0000-7000-8000-000000000009',
  job: '0199a000-0000-7000-8000-000000000010',
  jobVersion: '0199a000-0000-7000-8000-000000000011',
  application: '0199a000-0000-7000-8000-000000000012',
  parseRun: '0199a000-0000-7000-8000-000000000013',
} as const;

type SeedDb = Prisma.TransactionClient | PrismaClient;

export async function seedDemoData(db: SeedDb, password = DEMO_PASSWORD) {
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const candidateRole = await db.role.findUnique({
    where: { code: 'CANDIDATE' },
  });
  const recruiterRole = await db.role.findUnique({
    where: { code: 'RECRUITER' },
  });
  const appliedStage = await db.recruitmentStage.findFirst({
    where: { companyId: null, code: 'APPLIED', isActive: true },
  });
  const parserPipeline = await db.aiPipelineVersion.findUnique({
    where: { code: 'resume-parser-v1' },
  });

  if (!candidateRole || !recruiterRole || !appliedStage || !parserPipeline) {
    throw new Error(
      'HireSense system seed is missing; run Prisma migrations before the demo seed',
    );
  }

  const categoryIds = new Map<string, string>();
  for (const [code, name] of [
    ['PROGRAMMING_LANGUAGE', 'Programming Language'],
    ['BACKEND', 'Backend'],
    ['DATABASE', 'Database'],
    ['DEVOPS', 'DevOps'],
  ] as const) {
    const category = await db.skillCategory.upsert({
      where: { code },
      create: { code, name },
      update: { name },
    });
    categoryIds.set(code, category.id);
  }

  const candidateUser = await db.user.upsert({
    where: { email: DEMO_CANDIDATE_EMAIL },
    create: {
      id: DEMO_IDS.candidateUser,
      email: DEMO_CANDIDATE_EMAIL,
      passwordHash,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
    update: { passwordHash, status: 'ACTIVE', deletedAt: null },
  });
  const recruiterUser = await db.user.upsert({
    where: { email: DEMO_RECRUITER_EMAIL },
    create: {
      id: DEMO_IDS.recruiterUser,
      email: DEMO_RECRUITER_EMAIL,
      passwordHash,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
    update: { passwordHash, status: 'ACTIVE', deletedAt: null },
  });

  await db.userRole.upsert({
    where: {
      userId_roleId: { userId: candidateUser.id, roleId: candidateRole.id },
    },
    create: { userId: candidateUser.id, roleId: candidateRole.id },
    update: {},
  });
  await db.userRole.upsert({
    where: {
      userId_roleId: { userId: recruiterUser.id, roleId: recruiterRole.id },
    },
    create: { userId: recruiterUser.id, roleId: recruiterRole.id },
    update: {},
  });

  const candidate = await db.candidateProfile.upsert({
    where: { userId: candidateUser.id },
    create: {
      id: DEMO_IDS.candidateProfile,
      userId: candidateUser.id,
      fullName: 'Nguyen Minh Demo',
      headline: 'Backend Developer',
      summary:
        'Backend-focused developer with TypeScript, NestJS, PostgreSQL, and API experience.',
      city: 'Ho Chi Minh City',
      countryCode: 'VN',
      timezone: 'Asia/Ho_Chi_Minh',
      experienceMonthsDeclared: 30,
      githubUrl: 'https://github.com/hiresense-demo',
    },
    update: {
      fullName: 'Nguyen Minh Demo',
      headline: 'Backend Developer',
      city: 'Ho Chi Minh City',
      countryCode: 'VN',
      timezone: 'Asia/Ho_Chi_Minh',
      experienceMonthsDeclared: 30,
    },
  });
  await db.recruiterProfile.upsert({
    where: { userId: recruiterUser.id },
    create: {
      id: DEMO_IDS.recruiterProfile,
      userId: recruiterUser.id,
      fullName: 'Tran Anh Recruiter',
      jobTitle: 'Talent Acquisition Specialist',
    },
    update: {
      fullName: 'Tran Anh Recruiter',
      jobTitle: 'Talent Acquisition Specialist',
    },
  });

  const company = await db.company.upsert({
    where: { slug: 'hiresense-demo' },
    create: {
      id: DEMO_IDS.company,
      name: 'HireSense Demo Labs',
      slug: 'hiresense-demo',
      description: 'Demo company for the HireSense internship dataset.',
      websiteUrl: 'https://example.com/hiresense-demo',
      companySizeMin: 20,
      companySizeMax: 100,
      createdByUserId: recruiterUser.id,
    },
    update: { name: 'HireSense Demo Labs', status: 'ACTIVE', deletedAt: null },
  });
  await db.companyMembership.upsert({
    where: {
      companyId_userId: { companyId: company.id, userId: recruiterUser.id },
    },
    create: {
      id: DEMO_IDS.membership,
      companyId: company.id,
      userId: recruiterUser.id,
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: new Date(),
    },
    update: { role: 'OWNER', status: 'ACTIVE' },
  });

  const skillDefinitions = [
    ['TypeScript', 'typescript', 'PROGRAMMING_LANGUAGE'],
    ['NestJS', 'nestjs', 'BACKEND'],
    ['PostgreSQL', 'postgresql', 'DATABASE'],
    ['Docker', 'docker', 'DEVOPS'],
  ] as const;
  const skills = new Map<string, Awaited<ReturnType<typeof db.skill.upsert>>>();
  for (const [name, normalizedName, categoryCode] of skillDefinitions) {
    const skill = await db.skill.upsert({
      where: { normalizedName },
      create: {
        name,
        normalizedName,
        categoryId: categoryIds.get(categoryCode),
        isActive: true,
      },
      update: {
        name,
        categoryId: categoryIds.get(categoryCode),
        isActive: true,
      },
    });
    skills.set(normalizedName, skill);
  }

  await db.fileObject.upsert({
    where: { id: DEMO_IDS.fileObject },
    create: {
      id: DEMO_IDS.fileObject,
      storageProvider: 'DISCLOUD',
      bucket: 'resumes',
      objectKey: 'demo/candidate-backend-v1.pdf',
      originalFilename: 'nguyen-minh-demo-backend.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 4096n,
      sha256:
        '7c9a57a8d838f2efb2279771b6496a1d7f26c02b9b2b808283a04284183f337a',
      uploadedByUserId: candidateUser.id,
      status: 'ACTIVE',
    },
    update: {
      uploadedByUserId: candidateUser.id,
      status: 'ACTIVE',
      deletedAt: null,
    },
  });

  const resume = await db.resume.upsert({
    where: { id: DEMO_IDS.resume },
    create: {
      id: DEMO_IDS.resume,
      candidateProfileId: candidate.id,
      name: 'Backend CV',
      isDefault: true,
    },
    update: { name: 'Backend CV', isDefault: true, deletedAt: null },
  });
  await db.resumeVersion.upsert({
    where: { id: DEMO_IDS.resumeVersion },
    create: {
      id: DEMO_IDS.resumeVersion,
      resumeId: resume.id,
      versionNo: 1,
      fileObjectId: DEMO_IDS.fileObject,
      createdByUserId: candidateUser.id,
    },
    update: {
      fileObjectId: DEMO_IDS.fileObject,
      createdByUserId: candidateUser.id,
    },
  });
  await db.resume.update({
    where: { id: resume.id },
    data: { currentVersionId: DEMO_IDS.resumeVersion },
  });

  const job = await db.job.upsert({
    where: { id: DEMO_IDS.job },
    create: {
      id: DEMO_IDS.job,
      companyId: company.id,
      createdByUserId: recruiterUser.id,
      slug: 'backend-developer-demo',
      status: 'PUBLISHED',
      firstPublishedAt: new Date(),
    },
    update: {
      companyId: company.id,
      createdByUserId: recruiterUser.id,
      slug: 'backend-developer-demo',
      status: 'PUBLISHED',
      deletedAt: null,
    },
  });
  const jobVersion = await db.jobVersion.upsert({
    where: { id: DEMO_IDS.jobVersion },
    create: {
      id: DEMO_IDS.jobVersion,
      jobId: job.id,
      versionNo: 1,
      versionStatus: 'PUBLISHED',
      title: 'Backend Developer',
      summary:
        'Build reliable APIs and backend services for a growing product team.',
      description:
        'Develop and maintain backend services using TypeScript, NestJS, PostgreSQL, and containers.',
      responsibilities:
        'Design APIs, review code, improve tests, and collaborate with product engineers.',
      employmentType: 'FULL_TIME',
      workplaceType: 'HYBRID',
      experienceMinMonths: 24,
      experienceMaxMonths: 60,
      educationMinLevel: 'BACHELOR',
      salaryMin: '2000',
      salaryMax: '3500',
      salaryCurrency: 'USD',
      createdByUserId: recruiterUser.id,
      publishedAt: new Date(),
    },
    update: {
      versionStatus: 'PUBLISHED',
      title: 'Backend Developer',
      experienceMinMonths: 24,
      experienceMaxMonths: 60,
      educationMinLevel: 'BACHELOR',
      publishedAt: new Date(),
    },
  });
  await db.job.update({
    where: { id: job.id },
    data: { currentPublishedVersionId: jobVersion.id },
  });

  const requirements = [
    ['typescript', 5, true, '1.000000'],
    ['nestjs', 5, true, '1.000000'],
    ['postgresql', 4, false, '0.500000'],
    ['docker', 3, false, '0.500000'],
  ] as const;
  for (const [normalizedName, importance, isRequired, weight] of requirements) {
    const skill = skills.get(normalizedName);
    if (!skill) throw new Error(`Demo skill is missing: ${normalizedName}`);
    await db.jobVersionSkill.upsert({
      where: {
        jobVersionId_skillId: {
          jobVersionId: jobVersion.id,
          skillId: skill.id,
        },
      },
      create: {
        jobVersionId: jobVersion.id,
        skillId: skill.id,
        importance,
        isRequired,
        weight,
      },
      update: { importance, isRequired, weight },
    });
  }

  const application = await db.application.findUnique({
    where: { id: DEMO_IDS.application },
  });
  if (application?.currentMatchRunId) {
    await db.application.update({
      where: { id: DEMO_IDS.application },
      data: { currentMatchRunId: null },
    });
  }
  await db.applicationMatchRun.deleteMany({
    where: { applicationId: DEMO_IDS.application },
  });
  await db.application.upsert({
    where: { id: DEMO_IDS.application },
    create: {
      id: DEMO_IDS.application,
      jobId: job.id,
      jobVersionId: jobVersion.id,
      candidateProfileId: candidate.id,
      resumeVersionId: DEMO_IDS.resumeVersion,
      currentStageId: appliedStage.id,
      source: 'DIRECT',
      coverLetter:
        'I enjoy building dependable TypeScript backend systems and would like to contribute to this team.',
      appliedAt: new Date('2026-09-01T03:00:00Z'),
    },
    update: {
      jobVersionId: jobVersion.id,
      resumeVersionId: DEMO_IDS.resumeVersion,
      currentStageId: appliedStage.id,
      withdrawnAt: null,
      currentMatchRunId: null,
    },
  });
  await db.applicationStageHistory.deleteMany({
    where: { applicationId: DEMO_IDS.application },
  });
  await db.applicationStageHistory.create({
    data: {
      applicationId: DEMO_IDS.application,
      toStageId: appliedStage.id,
      createdAt: new Date('2026-09-01T03:00:00Z'),
    },
  });

  await db.resumeSkill.deleteMany({ where: { parseRunId: DEMO_IDS.parseRun } });
  await db.resumeExperience.deleteMany({
    where: { parseRunId: DEMO_IDS.parseRun },
  });
  await db.resumeEducation.deleteMany({
    where: { parseRunId: DEMO_IDS.parseRun },
  });
  await db.resumeParseRun.upsert({
    where: { id: DEMO_IDS.parseRun },
    create: {
      id: DEMO_IDS.parseRun,
      resumeVersionId: DEMO_IDS.resumeVersion,
      pipelineVersionId: parserPipeline.id,
      status: 'SUCCEEDED',
      rawText:
        'Backend Developer. TypeScript, NestJS, PostgreSQL. 30 months experience. Bachelor of Computer Science.',
      detectedLanguage: 'en',
      startedAt: new Date('2026-09-01T03:01:00Z'),
      completedAt: new Date('2026-09-01T03:01:01Z'),
    },
    update: {
      resumeVersionId: DEMO_IDS.resumeVersion,
      pipelineVersionId: parserPipeline.id,
      status: 'SUCCEEDED',
      errorCode: null,
      errorMessage: null,
      completedAt: new Date('2026-09-01T03:01:01Z'),
    },
  });

  await db.resumeSkill.createMany({
    data: ['typescript', 'nestjs', 'postgresql'].map((normalizedName) => {
      const skill = skills.get(normalizedName);
      if (!skill) throw new Error(`Demo skill is missing: ${normalizedName}`);
      return {
        parseRunId: DEMO_IDS.parseRun,
        skillId: skill.id,
        confidence: '0.990000',
        evidenceText: skill.name,
      };
    }),
  });
  await db.resumeExperience.createMany({
    data: [
      {
        parseRunId: DEMO_IDS.parseRun,
        companyName: 'Acme Software',
        jobTitle: 'Backend Developer',
        experienceMonths: 18,
        ordinal: 0,
        confidence: '0.950000',
      },
      {
        parseRunId: DEMO_IDS.parseRun,
        companyName: 'Example Studio',
        jobTitle: 'Junior Developer',
        experienceMonths: 12,
        ordinal: 1,
        confidence: '0.930000',
      },
    ],
  });
  await db.resumeEducation.create({
    data: {
      parseRunId: DEMO_IDS.parseRun,
      institutionName: 'Demo University',
      degree: 'Bachelor of Computer Science',
      fieldOfStudy: 'Computer Science',
      ordinal: 0,
      confidence: '0.970000',
    },
  });

  return {
    candidateUserId: candidateUser.id,
    recruiterUserId: recruiterUser.id,
    companyId: company.id,
    jobId: job.id,
    applicationId: DEMO_IDS.application,
  };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
  try {
    const result = await prisma.$transaction((tx) => seedDemoData(tx));
    console.log(
      `Seeded HireSense demo dataset: ${DEMO_CANDIDATE_EMAIL}, ${DEMO_RECRUITER_EMAIL}, application ${result.applicationId}`,
    );
    console.log(
      process.env.HIRESENSE_DEMO_PASSWORD
        ? 'Demo password: configured by HIRESENSE_DEMO_PASSWORD'
        : `Demo password: ${DEMO_PASSWORD}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) void main();
