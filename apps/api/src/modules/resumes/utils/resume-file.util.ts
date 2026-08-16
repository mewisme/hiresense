import { BadRequestException } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Multer } from 'multer';

export const RESUME_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'application/octet-stream']);

export function validateResumePdf(file: Express.Multer.File | undefined): asserts file is Express.Multer.File {
  if (!file) throw new BadRequestException('Resume PDF file is required');
  if (file.size <= 0) throw new BadRequestException('Resume PDF file is empty');
  if (file.size > RESUME_MAX_FILE_SIZE_BYTES) throw new BadRequestException('Resume PDF must not exceed 10 MB');
  if (!file.originalname.toLowerCase().endsWith('.pdf')) throw new BadRequestException('Resume file must have a .pdf extension');
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) throw new BadRequestException('Resume file must be a PDF');
  if (file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') throw new BadRequestException('Resume file does not contain a valid PDF header');
}