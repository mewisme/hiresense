import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ApplyJobDto } from './dto/apply-job.dto';
import { ChangeApplicationStageDto } from './dto/change-application-stage.dto';
import { RecruiterApplicationsQueryDto } from './dto/recruiter-applications-query.dto';

const UUID = '0198f4e1-7c2a-7bcd-8123-123456789abc';

describe('Application DTOs', () => {
  it('accepts valid ApplyJobDto and trims coverLetter', async () => {
    const dto = plainToInstance(ApplyJobDto, {
      resumeVersionId: UUID,
      coverLetter: '  Hello recruiter  ',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.coverLetter).toBe('Hello recruiter');
  });

  it('normalizes blank coverLetter to null', async () => {
    const dto = plainToInstance(ApplyJobDto, {
      resumeVersionId: UUID,
      coverLetter: '   ',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.coverLetter).toBeNull();
  });

  it('rejects invalid ResumeVersion UUID', async () => {
    const dto = plainToInstance(ApplyJobDto, {
      resumeVersionId: 'not-a-uuid',
    });

    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('uses recruiter query defaults', async () => {
    const dto = plainToInstance(RecruiterApplicationsQueryDto, {});

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
  });

  it('transforms recruiter pagination strings to numbers', async () => {
    const dto = plainToInstance(RecruiterApplicationsQueryDto, {
      stageId: UUID,
      page: '2',
      limit: '50',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(50);
  });

  it('rejects invalid pagination bounds', async () => {
    const dto = plainToInstance(RecruiterApplicationsQueryDto, {
      page: '0',
      limit: '51',
    });

    expect((await validate(dto)).length).toBe(2);
  });

  it('trims stage change note', async () => {
    const dto = plainToInstance(ChangeApplicationStageDto, {
      stageId: UUID,
      note: '  Passed screening  ',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.note).toBe('Passed screening');
  });

  it('normalizes blank stage change note to null', async () => {
    const dto = plainToInstance(ChangeApplicationStageDto, {
      stageId: UUID,
      note: '   ',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.note).toBeNull();
  });
});