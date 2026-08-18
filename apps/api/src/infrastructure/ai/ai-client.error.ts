export class AiClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'AiClientError';
  }
}