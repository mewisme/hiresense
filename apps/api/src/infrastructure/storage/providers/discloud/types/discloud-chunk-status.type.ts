export const DISCLOUD_CHUNK_STATUSES = [
  'UPLOADING',
  'ACTIVE',
  'FAILED',
  'MISSING',
  'DELETED',
] as const;

export type DiscloudChunkStatus =
  (typeof DISCLOUD_CHUNK_STATUSES)[number];

export function isDiscloudChunkStatus(
  value: string,
): value is DiscloudChunkStatus {
  return (
    DISCLOUD_CHUNK_STATUSES as readonly string[]
  ).includes(value);
}