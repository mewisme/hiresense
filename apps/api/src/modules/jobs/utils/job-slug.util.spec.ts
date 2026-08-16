import { describe, expect, it } from '@jest/globals';
import { createJobSlug } from './job-slug.util';

describe('createJobSlug', () => {
  it('creates a lowercase URL-safe slug', () => {
    const result = createJobSlug('Backend Developer');

    expect(result).toMatch(/^backend-developer-[0-9a-f]{8}$/);
  });

  it('removes repeated separators', () => {
    const result = createJobSlug('Backend   Developer --- NestJS');

    expect(result).toMatch(/^backend-developer-nestjs-[0-9a-f]{8}$/);
  });

  it('normalizes Vietnamese characters', () => {
    const result = createJobSlug('Lập Trình Viên Backend Đà Nẵng');

    expect(result).toMatch(/^lap-trinh-vien-backend-da-nang-[0-9a-f]{8}$/);
  });

  it('removes unsupported characters', () => {
    const result = createJobSlug('Backend @ Developer # NestJS!!!');

    expect(result).toMatch(/^backend-developer-nestjs-[0-9a-f]{8}$/);
  });

  it('does not begin or end the slug base with a hyphen', () => {
    const result = createJobSlug('--- Backend Developer ---');

    expect(result).toMatch(/^backend-developer-[0-9a-f]{8}$/);
  });

  it('uses job as fallback when title has no usable characters', () => {
    const result = createJobSlug('!!! @@@ ###');

    expect(result).toMatch(/^job-[0-9a-f]{8}$/);
  });

  it('limits the normalized title portion to 80 characters', () => {
    const result = createJobSlug('a'.repeat(200));
    const [base] = result.split(/-[0-9a-f]{8}$/);

    expect(base).toHaveLength(80);
  });

  it('creates different slugs for the same title', () => {
    const first = createJobSlug('Backend Developer');
    const second = createJobSlug('Backend Developer');

    expect(first).not.toBe(second);
    expect(first).toMatch(/^backend-developer-[0-9a-f]{8}$/);
    expect(second).toMatch(/^backend-developer-[0-9a-f]{8}$/);
  });
});