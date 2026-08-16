export const FILE_OBJECT_STATUSES = [
  'UPLOADING',
  'ACTIVE',
  'FAILED',
  'DELETED',
] as const;

export type FileObjectStatus =
  (typeof FILE_OBJECT_STATUSES)[number];

export function isFileObjectStatus(
  value: string,
): value is FileObjectStatus {
  return (
    FILE_OBJECT_STATUSES as readonly string[]
  ).includes(value);
}