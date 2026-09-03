import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/app.setup';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import {
  DEMO_CANDIDATE_EMAIL,
  DEMO_IDS,
  DEMO_PASSWORD,
  DEMO_RECRUITER_EMAIL,
  seedDemoData,
} from '../prisma/seed';

describe('Database-backed recruitment smoke flow', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.$transaction((tx) => seedDemoData(tx));
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('runs the persisted baseline matching flow as recruiter and exposes it to the candidate', async () => {
    const recruiter = await login(DEMO_RECRUITER_EMAIL);
    const recruiterApplications = await request(app.getHttpServer())
      .get(
        `/api/companies/${DEMO_IDS.company}/jobs/${DEMO_IDS.job}/applications`,
      )
      .set('Authorization', `Bearer ${recruiter.accessToken}`)
      .expect(200);
    expect(recruiterApplications.body.items).toHaveLength(1);
    expect(recruiterApplications.body.items[0]).toMatchObject({
      id: DEMO_IDS.application,
      candidate: { fullName: 'Nguyen Minh Demo' },
    });

    const run = await request(app.getHttpServer())
      .post(
        `/api/companies/${DEMO_IDS.company}/applications/${DEMO_IDS.application}/matching/runs`,
      )
      .set('Authorization', `Bearer ${recruiter.accessToken}`)
      .expect(201);
    expect(run.body).toMatchObject({
      applicationId: DEMO_IDS.application,
      status: 'SUCCEEDED',
      overallScore: 90,
    });
    expect(
      run.body.components.map((item: { code: string }) => item.code).sort(),
    ).toEqual(['EDUCATION', 'EXPERIENCE', 'SKILL']);
    expect(
      run.body.skills.filter(
        (item: { status: string }) => item.status === 'MATCHED',
      ),
    ).toHaveLength(3);
    expect(
      run.body.skills.filter(
        (item: { status: string }) => item.status === 'MISSING',
      ),
    ).toHaveLength(1);

    const persistedApplication = await prisma.application.findUnique({
      where: { id: DEMO_IDS.application },
      select: { currentMatchRunId: true },
    });
    expect(persistedApplication?.currentMatchRunId).toBe(run.body.id);

    const candidate = await login(DEMO_CANDIDATE_EMAIL);
    const candidateApplications = await request(app.getHttpServer())
      .get('/api/candidates/me/applications')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .expect(200);
    expect(candidateApplications.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: DEMO_IDS.application,
          jobVersion: expect.objectContaining({ title: 'Backend Developer' }),
        }),
      ]),
    );

    const currentMatch = await request(app.getHttpServer())
      .get(
        `/api/candidates/me/applications/${DEMO_IDS.application}/matching/current`,
      )
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .expect(200);
    expect(currentMatch.body).toMatchObject({
      id: run.body.id,
      overallScore: 90,
      pipeline: { code: 'matching-baseline-v1', semanticVersion: '1.0.0' },
    });
  });

  it('applies production validation rules to database-backed HTTP requests', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: DEMO_CANDIDATE_EMAIL,
        password: DEMO_PASSWORD,
        unexpected: true,
      })
      .expect(400);
  });

  async function login(email: string) {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: DEMO_PASSWORD })
      .expect(200);
    expect(response.body.user.email).toBe(email);
    return response.body as { accessToken: string; user: { email: string } };
  }
});
