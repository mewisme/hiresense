import { describe, expect, it, jest } from '@jest/globals';
import { CandidateMatchingController } from './candidate-matching.controller';
import { MatchingService } from './matching.service';

describe('CandidateMatchingController', () => {
  it('returns the mapped current result for the authenticated candidate', async () => {
    const getCurrentForCandidate = jest.fn(async () => ({
      id: 'run',
      applicationId: 'application',
      resumeParseRunId: 'parse-run',
      jobVersionId: 'job-version',
      pipelineVersionId: 'pipeline',
      status: 'SUCCEEDED',
      overallScore: { toString: () => '82.50' },
      startedAt: new Date('2026-08-27T00:00:00.000Z'),
      completedAt: new Date('2026-08-27T00:00:01.000Z'),
      errorCode: null,
      errorMessage: null,
      createdAt: new Date('2026-08-27T00:00:00.000Z'),
      pipelineVersion: {
        id: 'pipeline',
        code: 'baseline-match-v1',
        pipelineType: 'MATCHING',
        semanticVersion: '1.0.0',
        codeRevision: null,
      },
      resumeParseRun: {
        id: 'parse-run',
        pipelineVersionId: 'parse-pipeline',
        status: 'SUCCEEDED',
        detectedLanguage: 'en',
        startedAt: null,
        completedAt: null,
        createdAt: new Date('2026-08-27T00:00:00.000Z'),
      },
      components: [],
      skillResults: [],
    }));
    const controller = new CandidateMatchingController({
      getCurrentForCandidate,
    } as unknown as MatchingService);

    const result = await controller.getCurrent(
      {
        id: 'candidate',
        email: 'candidate@example.com',
        roles: ['CANDIDATE'],
        sessionId: 'session',
      },
      'application',
    );

    expect(getCurrentForCandidate).toHaveBeenCalledWith(
      'application',
      'candidate',
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'run',
        applicationId: 'application',
        overallScore: 82.5,
      }),
    );
  });
});
