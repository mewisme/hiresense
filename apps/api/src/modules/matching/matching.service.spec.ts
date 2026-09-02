import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { ApplicationsService } from '../applications/applications.service';
import { MatchingService } from './matching.service';
import { ApplicationMatchRunsRepository, type ApplicationMatchRunResult } from './repositories/application-match-runs.repository';
import { ApplicationBaselineMatchingService } from './services/application-baseline-matching.service';

const companyId = '0198c8e8-0000-7000-8000-000000000001';
const applicationId = '0198c8e8-0000-7000-8000-000000000002';
const matchRunId = '0198c8e8-0000-7000-8000-000000000003';
const userId = '0198c8e8-0000-7000-8000-000000000004';

function createService(options: { current?: ApplicationMatchRunResult | null; run?: ApplicationMatchRunResult | null } = {}) {
  const getForRecruiter = jest.fn(async () => ({ application: { id: applicationId }, history: [] }));
  const getMine = jest.fn(async () => ({ application: { id: applicationId }, history: [] }));
  const findCurrentByApplicationId = jest.fn(async () => options.current === undefined ? ({ id: matchRunId } as ApplicationMatchRunResult) : options.current);
  const findByIdForApplication = jest.fn(async () => options.run === undefined ? ({ id: matchRunId } as ApplicationMatchRunResult) : options.run);
  const run = jest.fn(async () => ({ id: matchRunId } as ApplicationMatchRunResult));
  const service = new MatchingService(
    { getForRecruiter, getMine } as unknown as ApplicationsService,
    { findCurrentByApplicationId, findByIdForApplication } as unknown as ApplicationMatchRunsRepository,
    { run } as unknown as ApplicationBaselineMatchingService,
  );
  return { service, getForRecruiter, getMine, findCurrentByApplicationId, findByIdForApplication, run };
}

describe('MatchingService', () => {
  it('authorizes company application access before starting a match run', async () => {
    const { service, getForRecruiter, run } = createService();
    await expect(service.runForRecruiter(companyId, applicationId, userId)).resolves.toMatchObject({ id: matchRunId });
    expect(getForRecruiter).toHaveBeenCalledWith(companyId, applicationId, userId);
    expect(run).toHaveBeenCalledWith(applicationId);
    expect(getForRecruiter.mock.invocationCallOrder[0]).toBeLessThan(run.mock.invocationCallOrder[0]);
  });

  it('returns the current match run after recruiter application authorization', async () => {
    const { service, getForRecruiter, findCurrentByApplicationId } = createService();
    await expect(service.getCurrentForRecruiter(companyId, applicationId, userId)).resolves.toMatchObject({ id: matchRunId });
    expect(getForRecruiter).toHaveBeenCalledWith(companyId, applicationId, userId);
    expect(findCurrentByApplicationId).toHaveBeenCalledWith(applicationId);
  });

  it('returns the current match run only after candidate ownership authorization', async () => {
    const { service, getMine, findCurrentByApplicationId } = createService();
    await expect(service.getCurrentForCandidate(applicationId, userId)).resolves.toMatchObject({ id: matchRunId });
    expect(getMine).toHaveBeenCalledWith(applicationId, userId);
    expect(findCurrentByApplicationId).toHaveBeenCalledWith(applicationId);
    expect(getMine.mock.invocationCallOrder[0]).toBeLessThan(findCurrentByApplicationId.mock.invocationCallOrder[0]);
  });

  it('returns a specific run only within the requested application', async () => {
    const { service, findByIdForApplication } = createService();
    await expect(service.getRunForRecruiter(companyId, applicationId, matchRunId, userId)).resolves.toMatchObject({ id: matchRunId });
    expect(findByIdForApplication).toHaveBeenCalledWith(matchRunId, applicationId);
  });

  it('rejects missing current and scoped historical match runs', async () => {
    await expect(createService({ current: null }).service.getCurrentForRecruiter(companyId, applicationId, userId)).rejects.toBeInstanceOf(NotFoundException);
    await expect(createService({ current: null }).service.getCurrentForCandidate(applicationId, userId)).rejects.toBeInstanceOf(NotFoundException);
    await expect(createService({ run: null }).service.getRunForRecruiter(companyId, applicationId, matchRunId, userId)).rejects.toBeInstanceOf(NotFoundException);
  });
});