export class JobVersionImmutableError extends Error {
  constructor(jobVersionId: string) {
    super(`Published job version is immutable: ${jobVersionId}`);
    this.name = 'JobVersionImmutableError';
  }
}