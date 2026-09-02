import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateJobDto } from './create-job.dto';
import { CreateJobSkillDto } from './create-job-skill.dto';
import { PublicJobsQueryDto } from './public-jobs-query.dto';
import { UpdateJobDto } from './update-job.dto';

const skillId = '0198c8e8-0000-7000-8000-000000000031';

async function errors<T extends object>(type: new () => T, value: object) {
  return validate(plainToInstance(type, value));
}

describe('Job DTOs', () => {
  describe('CreateJobSkillDto', () => {
    it('accepts a valid job skill', async () => {
      const result = await errors(CreateJobSkillDto, {
        skillId,
        importance: 5,
        isRequired: true,
        weight: '0.75',
        minExperienceMonths: 12,
      });

      expect(result).toHaveLength(0);
    });

    it('rejects an invalid skill UUID', async () => {
      const result = await errors(CreateJobSkillDto, { skillId: 'invalid' });

      expect(result.some((error) => error.property === 'skillId')).toBe(true);
    });

    it('rejects importance below 1', async () => {
      const result = await errors(CreateJobSkillDto, { skillId, importance: 0 });

      expect(result.some((error) => error.property === 'importance')).toBe(true);
    });

    it('rejects importance above 5', async () => {
      const result = await errors(CreateJobSkillDto, { skillId, importance: 6 });

      expect(result.some((error) => error.property === 'importance')).toBe(true);
    });

    it('rejects weight below zero', async () => {
      const result = await errors(CreateJobSkillDto, { skillId, weight: '-0.1' });

      expect(result.some((error) => error.property === 'weight')).toBe(true);
    });

    it('rejects weight above one', async () => {
      const result = await errors(CreateJobSkillDto, { skillId, weight: '1.1' });

      expect(result.some((error) => error.property === 'weight')).toBe(true);
    });

    it('accepts numeric weight and transforms it to string', async () => {
      const dto = plainToInstance(CreateJobSkillDto, { skillId, weight: 0.5 });
      const result = await validate(dto);

      expect(result).toHaveLength(0);
      expect(dto.weight).toBe('0.5');
    });

    it('rejects negative minimum experience', async () => {
      const result = await errors(CreateJobSkillDto, {
        skillId,
        minExperienceMonths: -1,
      });

      expect(result.some((error) => error.property === 'minExperienceMonths')).toBe(true);
    });
  });

  describe('CreateJobDto', () => {
    it('accepts a valid job payload', async () => {
      const result = await errors(CreateJobDto, {
        title: 'Backend Developer',
        description: 'Develop backend services.',
        employmentType: 'FULL_TIME',
        workplaceType: 'HYBRID',
        experienceMinMonths: 12,
        experienceMaxMonths: 36,
        educationMinLevel: 'bachelor',
        salaryMin: '15000000',
        salaryMax: '30000000',
        salaryCurrency: 'VND',
        skills: [{
          skillId,
          importance: 5,
          isRequired: true,
          weight: '1',
        }],
      });

      expect(result).toHaveLength(0);
    });

    it('normalizes and validates the minimum education level', async () => {
      const dto = plainToInstance(CreateJobDto, {
        title: 'Backend Developer',
        description: 'Description',
        educationMinLevel: ' bachelor ',
      });
      const result = await validate(dto);

      expect(result).toHaveLength(0);
      expect(dto.educationMinLevel).toBe('BACHELOR');
      expect((await errors(CreateJobDto, { title: 'Backend Developer', description: 'Description', educationMinLevel: 'DIPLOMA' })).some((error) => error.property === 'educationMinLevel')).toBe(true);
    });

    it('trims title', async () => {
      const dto = plainToInstance(CreateJobDto, {
        title: '  Backend Developer  ',
        description: 'Description',
      });

      const result = await validate(dto);

      expect(result).toHaveLength(0);
      expect(dto.title).toBe('Backend Developer');
    });

    it('converts empty summary to null', async () => {
      const dto = plainToInstance(CreateJobDto, {
        title: 'Backend Developer',
        description: 'Description',
        summary: '   ',
      });

      const result = await validate(dto);

      expect(result).toHaveLength(0);
      expect(dto.summary).toBeNull();
    });

    it('normalizes salary currency to uppercase', async () => {
      const dto = plainToInstance(CreateJobDto, {
        title: 'Backend Developer',
        description: 'Description',
        salaryCurrency: 'vnd',
      });

      const result = await validate(dto);

      expect(result).toHaveLength(0);
      expect(dto.salaryCurrency).toBe('VND');
    });

    it('rejects salary currency with invalid length', async () => {
      const result = await errors(CreateJobDto, {
        title: 'Backend Developer',
        description: 'Description',
        salaryCurrency: 'VN',
      });

      expect(result.some((error) => error.property === 'salaryCurrency')).toBe(true);
    });

    it('rejects empty title', async () => {
      const result = await errors(CreateJobDto, {
        title: '',
        description: 'Description',
      });

      expect(result.some((error) => error.property === 'title')).toBe(true);
    });

    it('rejects empty description', async () => {
      const result = await errors(CreateJobDto, {
        title: 'Backend Developer',
        description: '',
      });

      expect(result.some((error) => error.property === 'description')).toBe(true);
    });

    it('validates nested skill DTOs', async () => {
      const result = await errors(CreateJobDto, {
        title: 'Backend Developer',
        description: 'Description',
        skills: [{
          skillId: 'invalid',
          importance: 10,
        }],
      });

      expect(result.some((error) => error.property === 'skills')).toBe(true);
    });
  });

  describe('UpdateJobDto', () => {
    it('accepts an empty DTO at class-validator level', async () => {
      const result = await errors(UpdateJobDto, {});

      expect(result).toHaveLength(0);
    });

    it('allows nullable optional fields to be cleared', async () => {
      const result = await errors(UpdateJobDto, {
        summary: null,
        benefits: null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
        educationMinLevel: null,
      });

      expect(result).toHaveLength(0);
    });

    it('trims an updated title', async () => {
      const dto = plainToInstance(UpdateJobDto, { title: '  Senior Backend Developer  ' });
      const result = await validate(dto);

      expect(result).toHaveLength(0);
      expect(dto.title).toBe('Senior Backend Developer');
    });

    it('allows clearing all structured skills', async () => {
      const result = await errors(UpdateJobDto, { skills: [] });

      expect(result).toHaveLength(0);
    });

    it('rejects an invalid nested skill', async () => {
      const result = await errors(UpdateJobDto, {
        skills: [{ skillId: 'invalid' }],
      });

      expect(result.some((error) => error.property === 'skills')).toBe(true);
    });
  });

  describe('PublicJobsQueryDto', () => {
    it('uses default pagination values', async () => {
      const dto = plainToInstance(PublicJobsQueryDto, {});
      const result = await validate(dto);

      expect(result).toHaveLength(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
    });

    it('transforms page and limit query strings to numbers', async () => {
      const dto = plainToInstance(PublicJobsQueryDto, {
        page: '3',
        limit: '10',
      });

      const result = await validate(dto);

      expect(result).toHaveLength(0);
      expect(dto.page).toBe(3);
      expect(dto.limit).toBe(10);
    });

    it('rejects page below one', async () => {
      const result = await errors(PublicJobsQueryDto, {
        page: '0',
        limit: '20',
      });

      expect(result.some((error) => error.property === 'page')).toBe(true);
    });

    it('rejects limit above 50', async () => {
      const result = await errors(PublicJobsQueryDto, {
        page: '1',
        limit: '51',
      });

      expect(result.some((error) => error.property === 'limit')).toBe(true);
    });

    it('trims q and converts an empty q to undefined', async () => {
      const dto = plainToInstance(PublicJobsQueryDto, {
        q: '   ',
      });

      const result = await validate(dto);

      expect(result).toHaveLength(0);
      expect(dto.q).toBeUndefined();
    });

    it('rejects invalid companyId', async () => {
      const result = await errors(PublicJobsQueryDto, {
        companyId: 'invalid',
      });

      expect(result.some((error) => error.property === 'companyId')).toBe(true);
    });

    it('rejects invalid skillId', async () => {
      const result = await errors(PublicJobsQueryDto, {
        skillId: 'invalid',
      });

      expect(result.some((error) => error.property === 'skillId')).toBe(true);
    });
  });
});