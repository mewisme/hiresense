import { describe, expect, it } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import type { Express } from 'express';
import { RESUME_MAX_FILE_SIZE_BYTES, validateResumePdf } from './resume-file.util';

function createFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  const buffer = Buffer.from('%PDF-1.7 test');

  return {
    fieldname: 'file',
    originalname: 'resume.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: buffer.length,
    destination: '',
    filename: '',
    path: '',
    buffer,
    stream: undefined as never,
    ...overrides,
  };
}

describe('validateResumePdf', () => {
  it('accepts a valid PDF', () => {
    expect(() => validateResumePdf(createFile())).not.toThrow();
  });

  it('accepts application/octet-stream when the content is a PDF', () => {
    expect(() => validateResumePdf(createFile({ mimetype: 'application/octet-stream' }))).not.toThrow();
  });

  it('rejects a missing file', () => {
    expect(() => validateResumePdf(undefined)).toThrow(BadRequestException);
  });

  it('rejects an empty file', () => {
    expect(() => validateResumePdf(createFile({ size: 0, buffer: Buffer.alloc(0) }))).toThrow(BadRequestException);
  });

  it('rejects a non-PDF filename', () => {
    expect(() => validateResumePdf(createFile({ originalname: 'resume.txt' }))).toThrow(BadRequestException);
  });

  it('rejects an invalid MIME type', () => {
    expect(() => validateResumePdf(createFile({ mimetype: 'text/plain' }))).toThrow(BadRequestException);
  });

  it('rejects a fake PDF without the PDF signature', () => {
    const buffer = Buffer.from('not a pdf');
    expect(() => validateResumePdf(createFile({ buffer, size: buffer.length }))).toThrow(BadRequestException);
  });

  it('rejects a file larger than the allowed limit', () => {
    expect(() => validateResumePdf(createFile({ size: RESUME_MAX_FILE_SIZE_BYTES + 1 }))).toThrow(BadRequestException);
  });
});