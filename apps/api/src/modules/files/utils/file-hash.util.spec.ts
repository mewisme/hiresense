import { describe, expect, it } from '@jest/globals';
import { calculateSha256 } from './file-hash.util';

describe('calculateSha256', () => {
  it('should calculate SHA-256 as lowercase hex', () => {
    expect(calculateSha256(Buffer.from('HireSense', 'utf8'))).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should be deterministic', () => {
    const content = Buffer.from('resume-content');

    expect(calculateSha256(content)).toBe(calculateSha256(content));
  });

  it('should change when content changes', () => {
    expect(calculateSha256(Buffer.from('resume-v1'))).not.toBe(
      calculateSha256(Buffer.from('resume-v2')),
    );
  });
});