import { Readable } from 'node:stream';
import type {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import request from 'supertest';
import { configureApp } from '../src/bootstrap/app.setup';
import { ApplicationsService } from '../src/modules/applications/applications.service';
import { RecruiterApplicationsController } from '../src/modules/applications/recruiter-applications.controller';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/guards/roles.guard';
import type { AuthenticatedUser } from '../src/modules/auth/types/authenticated-user.type';
import type { AppRole } from '../src/modules/auth/types/role.type';
import { CandidatesService } from '../src/modules/candidates/candidates.service';
import { CandidateMatchingController } from '../src/modules/matching/candidate-matching.controller';
import { MatchingController } from '../src/modules/matching/matching.controller';
import { MatchingService } from '../src/modules/matching/matching.service';
import { ResumesController } from '../src/modules/resumes/resumes.controller';
import { ResumesService } from '../src/modules/resumes/resumes.service';

const companyId = '0198c8e8-0000-7000-8000-000000000001';
const applicationId = '0198c8e8-0000-7000-8000-000000000002';
const resumeId = '0198c8e8-0000-7000-8000-000000000003';
const userId = '0198c8e8-0000-7000-8000-000000000004';

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: AuthenticatedUser;
    }>();
    const rawRole = request.headers['x-test-role'];
    const role = Array.isArray(rawRole) ? rawRole[0] : rawRole;
    if (role !== 'CANDIDATE' && role !== 'RECRUITER')
      throw new UnauthorizedException('Test authentication required');
    request.user = {
      id: userId,
      sessionId: 'test-session',
      email: 'test@example.com',
      roles: [role as AppRole],
    };
    return true;
  }
}

const matchRun = {
  id: '0198c8e8-0000-7000-8000-000000000005',
  applicationId,
  resumeParseRunId: '0198c8e8-0000-7000-8000-000000000006',
  jobVersionId: '0198c8e8-0000-7000-8000-000000000007',
  pipelineVersionId: '0198c8e8-0000-7000-8000-000000000008',
  status: 'SUCCEEDED',
  overallScore: null,
  startedAt: new Date('2026-09-03T00:00:00Z'),
  completedAt: new Date('2026-09-03T00:00:01Z'),
  errorCode: null,
  errorMessage: null,
  createdAt: new Date('2026-09-03T00:00:00Z'),
  pipelineVersion: {
    id: 'pipeline',
    code: 'matching-baseline-v1',
    pipelineType: 'MATCHING',
    semanticVersion: '1.0.0',
    codeRevision: null,
  },
  resumeParseRun: {
    id: 'parse',
    pipelineVersionId: 'parser',
    status: 'SUCCEEDED',
    detectedLanguage: 'en',
    startedAt: null,
    completedAt: null,
    createdAt: new Date('2026-09-03T00:00:00Z'),
  },
  components: [],
  skillResults: [],
};

describe('Core API HTTP security', () => {
  let app: INestApplication;
  const getCurrentForCandidate = jest.fn(async () => matchRun);
  const getCurrentForRecruiter = jest.fn(async () => matchRun);
  const runForRecruiter = jest.fn(async () => matchRun);
  const getRunForRecruiter = jest.fn(async () => matchRun);
  const openRecruiterResume = jest.fn(async () => fileResult());
  const findCandidate = jest.fn(async () => ({ id: 'candidate-profile' }));
  const openCurrentVersion = jest.fn(async () => fileResult());
  const openVersion = jest.fn(async () => fileResult());

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        CandidateMatchingController,
        MatchingController,
        RecruiterApplicationsController,
        ResumesController,
      ],
      providers: [
        Reflector,
        RolesGuard,
        {
          provide: MatchingService,
          useValue: {
            getCurrentForCandidate,
            getCurrentForRecruiter,
            runForRecruiter,
            getRunForRecruiter,
          },
        },
        { provide: ApplicationsService, useValue: { openRecruiterResume } },
        {
          provide: CandidatesService,
          useValue: { findByUserId: findCandidate },
        },
        {
          provide: ResumesService,
          useValue: { openCurrentVersion, openVersion },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .compile();

    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });

  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => {
    if (app) await app.close();
  });

  it('allows a candidate to read only the candidate matching route', async () => {
    await request(app.getHttpServer())
      .get(`/api/candidates/me/applications/${applicationId}/matching/current`)
      .set('x-test-role', 'CANDIDATE')
      .expect(200);
    expect(getCurrentForCandidate).toHaveBeenCalledWith(applicationId, userId);

    await request(app.getHttpServer())
      .get(
        `/api/companies/${companyId}/applications/${applicationId}/matching/current`,
      )
      .set('x-test-role', 'CANDIDATE')
      .expect(403);
    expect(getCurrentForRecruiter).not.toHaveBeenCalled();
  });

  it('allows a recruiter to read only recruiter matching routes', async () => {
    await request(app.getHttpServer())
      .get(
        `/api/companies/${companyId}/applications/${applicationId}/matching/current`,
      )
      .set('x-test-role', 'RECRUITER')
      .expect(200);
    expect(getCurrentForRecruiter).toHaveBeenCalledWith(
      companyId,
      applicationId,
      userId,
    );

    await request(app.getHttpServer())
      .get(`/api/candidates/me/applications/${applicationId}/matching/current`)
      .set('x-test-role', 'RECRUITER')
      .expect(403);
    expect(getCurrentForCandidate).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated and invalid UUID requests before service execution', async () => {
    await request(app.getHttpServer())
      .get(`/api/candidates/me/applications/${applicationId}/matching/current`)
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/candidates/me/applications/not-a-uuid/matching/current')
      .set('x-test-role', 'CANDIDATE')
      .expect(400);
    expect(getCurrentForCandidate).not.toHaveBeenCalled();
  });

  it('protects recruiter application resume downloads with private response headers', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/companies/${companyId}/applications/${applicationId}/resume`)
      .set('x-test-role', 'RECRUITER')
      .expect(200)
      .expect('Content-Type', /application\/pdf/);
    expect(response.headers['content-disposition']).toContain('attachment;');
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.headers.pragma).toBe('no-cache');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(openRecruiterResume).toHaveBeenCalledWith(
      companyId,
      applicationId,
      userId,
    );
  });

  it('protects candidate resume downloads with the same private response headers', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/resumes/${resumeId}/download`)
      .set('x-test-role', 'CANDIDATE')
      .expect(200)
      .expect('Content-Type', /application\/pdf/);
    expect(response.headers['content-disposition']).toContain('attachment;');
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.headers.pragma).toBe('no-cache');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(findCandidate).toHaveBeenCalledWith(userId);
    expect(openCurrentVersion).toHaveBeenCalledWith(
      resumeId,
      'candidate-profile',
    );
  });

  it('blocks cross-role file access at the HTTP boundary', async () => {
    await request(app.getHttpServer())
      .get(`/api/companies/${companyId}/applications/${applicationId}/resume`)
      .set('x-test-role', 'CANDIDATE')
      .expect(403);
    await request(app.getHttpServer())
      .get(`/api/resumes/${resumeId}/download`)
      .set('x-test-role', 'RECRUITER')
      .expect(403);
    expect(openRecruiterResume).not.toHaveBeenCalled();
    expect(openCurrentVersion).not.toHaveBeenCalled();
  });
});

function fileResult() {
  const content = Buffer.from('%PDF-test');
  return {
    stream: Readable.from([content]),
    contentType: 'application/pdf',
    sizeBytes: BigInt(content.length),
    fileObject: { id: 'file-object', originalFilename: 'candidate.pdf' },
    resumeVersion: { id: 'resume-version' },
  };
}
