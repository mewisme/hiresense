import { describe, expect, it } from '@jest/globals';
import { isJobStatus, JOB_STATUSES } from './job-status.type';
import { isJobVersionStatus, JOB_VERSION_STATUSES } from './job-version-status.type';

describe('Job status types', () => {
  describe('JOB_STATUSES', () => {
    it('contains all supported job lifecycle statuses', () => {
      expect(JOB_STATUSES).toEqual([
        'DRAFT',
        'PUBLISHED',
        'PAUSED',
        'CLOSED',
        'ARCHIVED',
      ]);
    });

    it.each([
      'DRAFT',
      'PUBLISHED',
      'PAUSED',
      'CLOSED',
      'ARCHIVED',
    ])('accepts %s as a JobStatus', (status) => {
      expect(isJobStatus(status)).toBe(true);
    });

    it.each([
      '',
      'ACTIVE',
      'DELETED',
      'PUBLISHING',
      'draft',
      'published',
    ])('rejects %s as a JobStatus', (status) => {
      expect(isJobStatus(status)).toBe(false);
    });
  });

  describe('JOB_VERSION_STATUSES', () => {
    it('contains only mutable draft and immutable published states', () => {
      expect(JOB_VERSION_STATUSES).toEqual([
        'DRAFT',
        'PUBLISHED',
      ]);
    });

    it.each([
      'DRAFT',
      'PUBLISHED',
    ])('accepts %s as a JobVersionStatus', (status) => {
      expect(isJobVersionStatus(status)).toBe(true);
    });

    it.each([
      '',
      'PAUSED',
      'CLOSED',
      'ARCHIVED',
      'draft',
      'published',
    ])('rejects %s as a JobVersionStatus', (status) => {
      expect(isJobVersionStatus(status)).toBe(false);
    });
  });
});