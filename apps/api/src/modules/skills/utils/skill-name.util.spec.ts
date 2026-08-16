import { describe, expect, it } from '@jest/globals';
import { normalizeSkillName } from './skill-name.util';

describe('normalizeSkillName', () => {
  it('should trim and lowercase', () => {
    expect(normalizeSkillName('  PostgreSQL  ')).toBe('postgresql');
  });

  it('should collapse whitespace', () => {
    expect(normalizeSkillName('Machine   Learning')).toBe('machine learning');
  });

  it('should preserve meaningful punctuation', () => {
    expect(normalizeSkillName('C++')).toBe('c++');
    expect(normalizeSkillName('C#')).toBe('c#');
    expect(normalizeSkillName('.NET')).toBe('.net');
    expect(normalizeSkillName('Node.js')).toBe('node.js');
  });

  it('should normalize unicode width', () => {
    expect(normalizeSkillName('Ｎｏｄｅ．ｊｓ')).toBe('node.js');
  });
});