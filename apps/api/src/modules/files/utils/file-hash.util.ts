import {
  createHash,
} from 'node:crypto';

export function calculateSha256(
  content: Buffer,
): string {
  return createHash('sha256')
    .update(content)
    .digest('hex');
}