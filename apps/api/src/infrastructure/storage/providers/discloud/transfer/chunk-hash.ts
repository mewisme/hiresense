import {
  createHash,
} from 'node:crypto';

export function hashChunk(
  content: Buffer,
): string {
  return createHash(
    'sha256',
  )
    .update(content)
    .digest('hex');
}