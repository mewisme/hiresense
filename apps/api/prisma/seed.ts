import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const DEMO_PASSWORD = 'Password123!';

const SKILLS: Array<{ name: string; categoryCode: string }> = [
  { name: 'TypeScript', categoryCode: 'PROGRAMMING_LANGUAGE' },
  { name: 'JavaScript', categoryCode: 'PROGRAMMING_LANGUAGE' },
  { name: 'Python', categoryCode: 'PROGRAMMING_LANGUAGE' },
  { name: 'React', categoryCode: 'FRONTEND' },
  { name: 'Next.js', categoryCode: 'FRONTEND' },
  { name: 'Node.js', categoryCode: 'BACKEND' },
  { name: 'NestJS', categoryCode: 'BACKEND' },
  { name: 'PostgreSQL', categoryCode: 'DATABASE' },
  { name: 'Docker', categoryCode: 'DEVOPS' },
  { name: 'Git', categoryCode: 'DEVOPS' },
];

function normalizeSkillName(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/\s+/g, ' ');
}

async function upsertUser(
  prisma: PrismaClient,
  email: string,
  roleCode: 'CANDIDATE' | 'RECRUITER',
  passwordHash: string,
) {
  const role = await prisma.role.findUniqueOrThrow({
    where: { code: roleCode },
  });
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { userRoles: true },
  });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, status: 'ACTIVE', deletedAt: null },
    });
    if (!existing.userRoles.some((item) => item.roleId === role.id)) {
      await prisma.userRole.create({
        data: { userId: existing.id, roleId: role.id },
      });
    }
    return existing;
  }
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      status: 'ACTIVE',
      userRoles: { create: { roleId: role.id } },
    },
  });
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const passwordHash = await argon2.hash(DEMO_PASSWORD, {
      type: argon2.argon2id,
    });

    const categories = await prisma.skillCategory.findMany();
    const categoryByCode = new Map(categories.map((c) => [c.code, c.id]));

    for (const skill of SKILLS) {
      const categoryId = categoryByCode.get(skill.categoryCode);
      if (!categoryId)
        throw new Error(`Missing skill category ${skill.categoryCode}`);
      const normalizedName = normalizeSkillName(skill.name);
      await prisma.skill.upsert({
        where: { normalizedName },
        create: {
          name: skill.name,
          normalizedName,
          categoryId,
          isActive: true,
        },
        update: {
          name: skill.name,
          categoryId,
          isActive: true,
        },
      });
    }

    const recruiter = await upsertUser(
      prisma,
      'recruiter@demo.hiresense.local',
      'RECRUITER',
      passwordHash,
    );
    const candidate = await upsertUser(
      prisma,
      'candidate@demo.hiresense.local',
      'CANDIDATE',
      passwordHash,
    );

    await prisma.recruiterProfile.upsert({
      where: { userId: recruiter.id },
      create: {
        userId: recruiter.id,
        fullName: 'Lan Recruiter',
        jobTitle: 'Talent Partner',
        phone: '+84000000001',
      },
      update: {
        fullName: 'Lan Recruiter',
        jobTitle: 'Talent Partner',
        phone: '+84000000001',
      },
    });

    await prisma.candidateProfile.upsert({
      where: { userId: candidate.id },
      create: {
        userId: candidate.id,
        fullName: 'An Nguyen',
        headline: 'Full-stack developer',
        summary: 'Synthetic demo candidate for HireSense Internship V1.',
        city: 'Ho Chi Minh City',
        countryCode: 'VN',
        experienceMonthsDeclared: 24,
        githubUrl: 'https://github.com/example-an-nguyen',
      },
      update: {
        fullName: 'An Nguyen',
        headline: 'Full-stack developer',
        summary: 'Synthetic demo candidate for HireSense Internship V1.',
        city: 'Ho Chi Minh City',
        countryCode: 'VN',
        experienceMonthsDeclared: 24,
        githubUrl: 'https://github.com/example-an-nguyen',
      },
    });

    let company = await prisma.company.findUnique({
      where: { slug: 'hiresense-demo' },
    });
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'HireSense Demo Co',
          slug: 'hiresense-demo',
          description:
            'Deterministic demo company for Internship V1 defense flow.',
          websiteUrl: 'https://example.com/hiresense-demo',
          status: 'ACTIVE',
          createdByUserId: recruiter.id,
          memberships: {
            create: {
              userId: recruiter.id,
              role: 'OWNER',
              status: 'ACTIVE',
              joinedAt: new Date(),
            },
          },
        },
      });
    } else {
      await prisma.companyMembership.upsert({
        where: {
          companyId_userId: { companyId: company.id, userId: recruiter.id },
        },
        create: {
          companyId: company.id,
          userId: recruiter.id,
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
        update: { role: 'OWNER', status: 'ACTIVE' },
      });
    }

    const skillRows = await prisma.skill.findMany({
      where: {
        normalizedName: {
          in: ['typescript', 'react', 'nestjs', 'postgresql', 'docker'],
        },
      },
    });
    const skillByName = new Map(skillRows.map((s) => [s.normalizedName, s]));

    let job = await prisma.job.findUnique({
      where: {
        companyId_slug: { companyId: company.id, slug: 'fullstack-engineer' },
      },
    });

    if (!job) {
      job = await prisma.job.create({
        data: {
          companyId: company.id,
          createdByUserId: recruiter.id,
          slug: 'fullstack-engineer',
          status: 'DRAFT',
        },
      });

      const version = await prisma.jobVersion.create({
        data: {
          jobId: job.id,
          versionNo: 1,
          versionStatus: 'DRAFT',
          title: 'Full-stack Engineer',
          summary: 'Build HireSense product features across web and API.',
          description:
            'We need a full-stack engineer comfortable with TypeScript, React, NestJS, and PostgreSQL. Docker experience is a plus.',
          employmentType: 'FULL_TIME',
          workplaceType: 'HYBRID',
          experienceMinMonths: 12,
          educationMinDegree: 'BACHELOR',
          createdByUserId: recruiter.id,
          skills: {
            create: [
              {
                skillId: skillByName.get('typescript')!.id,
                isRequired: true,
                importance: 5,
                weight: 1,
              },
              {
                skillId: skillByName.get('react')!.id,
                isRequired: true,
                importance: 4,
                weight: 1,
              },
              {
                skillId: skillByName.get('nestjs')!.id,
                isRequired: true,
                importance: 4,
                weight: 1,
              },
              {
                skillId: skillByName.get('postgresql')!.id,
                isRequired: true,
                importance: 3,
                weight: 1,
              },
              {
                skillId: skillByName.get('docker')!.id,
                isRequired: false,
                importance: 2,
                weight: 0.5,
              },
            ],
          },
        },
      });

      const publishedAt = new Date();
      await prisma.jobVersion.update({
        where: { id: version.id },
        data: { versionStatus: 'PUBLISHED', publishedAt },
      });
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'PUBLISHED',
          currentPublishedVersionId: version.id,
          firstPublishedAt: publishedAt,
        },
      });
    }

    console.log('Demo seed ready.');
    console.log('  recruiter@demo.hiresense.local / Password123!');
    console.log('  candidate@demo.hiresense.local / Password123!');
    console.log('  company slug: hiresense-demo');
    console.log('  published job slug: fullstack-engineer');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
