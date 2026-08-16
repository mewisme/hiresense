export class DiscordAttachmentGoneError extends Error {
  constructor(messageId: string) {
    super(`Discord attachment is gone for message ${messageId}`);
    this.name = 'DiscordAttachmentGoneError';
  }
}

export class DiscordBotUnavailableError extends Error {
  constructor(botKey: string) {
    super(`Discord bot is not configured: ${botKey}`);
    this.name = 'DiscordBotUnavailableError';
  }
}

export class DiscordApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'DiscordApiError';
  }
}