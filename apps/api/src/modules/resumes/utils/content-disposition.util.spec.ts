import { describe, expect, it } from '@jest/globals';
import { createAttachmentDisposition } from './content-disposition.util';

describe('createAttachmentDisposition', () => {
  it('creates a disposition for an ASCII filename', () => {
    expect(createAttachmentDisposition('resume.pdf')).toBe(
      `attachment; filename="resume.pdf"; filename*=UTF-8''resume.pdf`,
    );
  });

  it('encodes unicode filenames', () => {
    const result = createAttachmentDisposition('CV Nguyễn Văn A.pdf');

    expect(result).toContain('attachment;');
    expect(result).toContain(`filename*=UTF-8''CV%20Nguy%E1%BB%85n%20V%C4%83n%20A.pdf`);
  });

  it('removes CRLF characters', () => {
    const result = createAttachmentDisposition('resume\r\nInjected.pdf');

    expect(result).not.toContain('\r');
    expect(result).not.toContain('\n');
  });

  it('falls back to resume.pdf for an empty filename', () => {
    expect(createAttachmentDisposition('')).toContain('filename="resume.pdf"');
  });
});