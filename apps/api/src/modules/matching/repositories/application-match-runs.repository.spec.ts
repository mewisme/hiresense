import { describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { ApplicationMatchRunsRepository } from './application-match-runs.repository';

function createRepository(options: { completeCount?: number; applicationCount?: number } = {}) {
  const componentCreateMany = jest.fn(async () => ({ count: 2 }));
  const skillCreateMany = jest.fn(async () => ({ count: 1 }));
  const runUpdateMany = jest.fn(async () => ({ count: options.completeCount ?? 1 }));
  const applicationUpdateMany = jest.fn(async () => ({ count: options.applicationCount ?? 1 }));
  const runFindFirst = jest.fn(async () => ({ id: 'run' }));
  const runFindUnique = jest.fn(async () => ({ id: 'run' }));
  const applicationFindUnique = jest.fn(async () => ({ currentMatchRun: { id: 'run' } }));
  const tx = {
    matchScoreComponent: { createMany: componentCreateMany },
    matchSkillResult: { createMany: skillCreateMany },
    applicationMatchRun: { updateMany: runUpdateMany },
    application: { updateMany: applicationUpdateMany },
  };
  const transaction = jest.fn(async (callback: (client: typeof tx) => Promise<void>) => callback(tx));
  const repository = new ApplicationMatchRunsRepository({
    $transaction: transaction,
    applicationMatchRun: { findFirst: runFindFirst, findUnique: runFindUnique },
    application: { findUnique: applicationFindUnique },
  } as unknown as PrismaService);
  return { repository, transaction, componentCreateMany, skillCreateMany, runUpdateMany, applicationUpdateMany, runFindFirst, runFindUnique, applicationFindUnique };
}

describe('ApplicationMatchRunsRepository', () => {
  it('atomically persists components, skill results, completion and current pointer', async () => {
    const { repository, transaction, componentCreateMany, skillCreateMany, runUpdateMany, applicationUpdateMany } = createRepository();
    await repository.persistSucceeded(
      '0198c8e8-0000-7000-8000-000000000010',
      '0198c8e8-0000-7000-8000-000000000001',
      85.29,
      [{ componentCode: 'SKILL', rawScore: 100, weight: '0.705882', weightedScore: 70.588235, details: { formulaVersion: 'skill-weighted-exact-v1' } }],
      [{ jobVersionSkillId: '0198c8e8-0000-7000-8000-000000000005', resumeSkillId: '0198c8e8-0000-7000-8000-000000000008', status: 'MATCHED', similarityScore: 1, evidenceText: 'TypeScript' }],
    );

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(componentCreateMany).toHaveBeenCalledWith({ data: [expect.objectContaining({ matchRunId: '0198c8e8-0000-7000-8000-000000000010', componentCode: 'SKILL' })] });
    expect(skillCreateMany).toHaveBeenCalledWith({ data: [expect.objectContaining({ matchRunId: '0198c8e8-0000-7000-8000-000000000010', status: 'MATCHED', evidenceText: 'TypeScript' })] });
    expect(runUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: '0198c8e8-0000-7000-8000-000000000010', applicationId: '0198c8e8-0000-7000-8000-000000000001', status: 'PROCESSING' }, data: expect.objectContaining({ status: 'SUCCEEDED' }) }));
    expect(applicationUpdateMany).toHaveBeenCalledWith({ where: { id: '0198c8e8-0000-7000-8000-000000000001' }, data: { currentMatchRunId: '0198c8e8-0000-7000-8000-000000000010' } });
  });

  it('aborts the transaction when the run cannot transition from processing', async () => {
    const { repository, applicationUpdateMany } = createRepository({ completeCount: 0 });
    await expect(repository.persistSucceeded('run', 'application', 50, [], [])).rejects.toThrow('Application match run could not be completed');
    expect(applicationUpdateMany).not.toHaveBeenCalled();
  });

  it('aborts the transaction when the application current pointer cannot be updated', async () => {
    const { repository } = createRepository({ applicationCount: 0 });
    await expect(repository.persistSucceeded('run', 'application', 50, [], [])).rejects.toThrow('Application current match run could not be updated');
  });

  it('scopes historical run lookup to its application', async () => {
    const { repository, runFindFirst } = createRepository();
    await repository.findByIdForApplication('run', 'application');
    expect(runFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'run', applicationId: 'application' } }));
  });

  it('loads the application current match run through the composite relation', async () => {
    const { repository, applicationFindUnique } = createRepository();
    await expect(repository.findCurrentByApplicationId('application')).resolves.toEqual({ id: 'run' });
    expect(applicationFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'application' }, select: expect.objectContaining({ currentMatchRun: expect.any(Object) }) }));
  });
});
