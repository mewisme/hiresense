import {
  randomUUID,
} from 'node:crypto';

export function createFileObjectKey(
  userId: string,
  extension: string,
): string {
  const normalizedExtension =
    extension
      .trim()
      .toLowerCase()
      .replace(/^\./, '');

  const objectId =
    randomUUID();

  if (!normalizedExtension) {
    return [
      'users',
      userId,
      'resumes',
      objectId,
    ].join('/');
  }

  return [
    'users',
    userId,
    'resumes',
    `${objectId}.${normalizedExtension}`,
  ].join('/');
}