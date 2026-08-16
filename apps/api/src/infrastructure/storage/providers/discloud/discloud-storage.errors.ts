export class DiscloudChunkUnavailableError extends Error {
  constructor(sha256: string) {
    super(`DisCloud chunk is unavailable: ${sha256}`);
    this.name = 'DiscloudChunkUnavailableError';
  }
}

export class DiscloudUploadConflictError extends Error {
  constructor(sha256: string) {
    super(`DisCloud chunk is currently being uploaded: ${sha256}`);
    this.name = 'DiscloudUploadConflictError';
  }
}