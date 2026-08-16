import { describe, expect, it } from '@jest/globals';
import { createFileObjectKey } from './file-object-key.util';

describe('createFileObjectKey', () => {
  it('should create a user-scoped resume key', () => {
    const key = createFileObjectKey('user-id', 'pdf');

    expect(key).toMatch(/^users\/user-id\/resumes\/.+\.pdf$/);
  });

  it('should normalize extension', () => {
    const key = createFileObjectKey('user-id', '.PDF');

    expect(key.endsWith('.pdf')).toBe(true);
  });
});