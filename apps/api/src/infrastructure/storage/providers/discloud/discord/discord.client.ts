import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DiscloudBotConfig } from '../../../../../config/storage.config';
import { DiscordApiError, DiscordAttachmentGoneError } from './discord.errors';
import type { DiscordMessage, DiscordUploadResult } from './discord.types';

interface RuntimeDiscordBot extends DiscloudBotConfig {
  waitUntilMs: number;
}

@Injectable()
export class DiscordClient {
  private readonly baseUrl: string;
  private readonly channelId: string;
  private readonly bots: RuntimeDiscordBot[];
  private readonly requestTimeoutMs: number;
  private readonly maxAttempts: number;
  private nextBotIndex = 0;

  constructor(configService: ConfigService) {
    this.baseUrl = configService.getOrThrow<string>('storage.discloud.apiBaseUrl').replace(/\/+$/, '');
    this.channelId = configService.getOrThrow<string>('storage.discloud.channelId');

    const configuredBots = configService.get<DiscloudBotConfig[]>('storage.discloud.bots') ?? [];
    if (configuredBots.length === 0) throw new Error('At least one DisCloud bot must be configured');

    this.bots = configuredBots.map((bot) => ({ ...bot, waitUntilMs: 0 }));
    this.requestTimeoutMs = configService.getOrThrow<number>('storage.discloud.requestTimeoutMs');
    this.maxAttempts = configService.getOrThrow<number>('storage.discloud.maxAttempts');
  }

  async uploadChunk(filename: string, content: Buffer): Promise<DiscordUploadResult> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      const bot = this.nextBot();

      try {
        await this.waitForBot(bot);
        const response = await this.postAttachment(bot, filename, content);

        if (response.status === 429) {
          const retryAfterMs = await this.parseRetryAfterMs(response);
          this.backoff(bot, retryAfterMs);
          throw new DiscordApiError(429, `Discord bot ${bot.id} rate limited for ${retryAfterMs}ms`);
        }

        this.updateRateLimitState(bot, response);
        if (response.status !== 200 && response.status !== 201) throw await this.createApiError(response, `Discord upload failed using bot ${bot.id} for ${filename}`);

        const message = await this.readMessage(response);
        const attachment = message.attachments[0];
        if (!attachment) throw new DiscordApiError(response.status, `Discord message ${message.id} has no attachments`);

        return { messageId: message.id, attachmentId: attachment.id, filename: attachment.filename };
      } catch (error) {
        lastError = error;
        if (attempt === this.maxAttempts) break;
      }
    }

    if (lastError instanceof Error) throw lastError;
    throw new Error(`Discord upload failed after ${this.maxAttempts} attempts`);
  }

  async getAttachmentUrl(messageId: string, attachmentId: string): Promise<string> {
    const response = await this.executeAcrossBots(
      (bot) => this.fetchWithTimeout(`${this.baseUrl}/channels/${this.channelId}/messages/${messageId}`, {
        method: 'GET',
        headers: { Authorization: `Bot ${bot.token}` },
      }),
      `Failed to read Discord message ${messageId}`,
      [404],
    );

    if (response.status === 404) throw new DiscordAttachmentGoneError(messageId);

    const message = await this.readMessage(response);
    const attachment = message.attachments.find((item) => item.id === attachmentId);
    if (!attachment) throw new DiscordAttachmentGoneError(messageId);
    return attachment.url;
  }

  async deleteMessage(messageId: string): Promise<void> {
    const response = await this.executeAcrossBots(
      (bot) => this.fetchWithTimeout(`${this.baseUrl}/channels/${this.channelId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bot ${bot.token}` },
      }),
      `Failed to delete Discord message ${messageId}`,
      [404],
    );

    if (response.status === 404) return;
  }

  private nextBot(): RuntimeDiscordBot {
    const bot = this.bots[this.nextBotIndex];
    if (!bot) throw new Error('No Discord bot available');
    this.nextBotIndex = (this.nextBotIndex + 1) % this.bots.length;
    return bot;
  }

  private async executeAcrossBots(operation: (bot: RuntimeDiscordBot) => Promise<Response>, context: string, acceptedStatuses: readonly number[] = []): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      const bot = this.nextBot();

      try {
        await this.waitForBot(bot);
        const response = await operation(bot);

        if (response.status === 429) {
          const retryAfterMs = await this.parseRetryAfterMs(response);
          this.backoff(bot, retryAfterMs);
          lastError = new DiscordApiError(429, `Discord bot ${bot.id} rate limited for ${retryAfterMs}ms`);
          continue;
        }

        this.updateRateLimitState(bot, response);
        if (response.ok || acceptedStatuses.includes(response.status)) return response;
        lastError = await this.createApiError(response, `${context} using bot ${bot.id}`);
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError instanceof Error) throw lastError;
    throw new Error(`${context} after ${this.maxAttempts} attempts`);
  }

  private async waitForBot(bot: RuntimeDiscordBot): Promise<void> {
    const remainingMs = bot.waitUntilMs - Date.now();
    if (remainingMs <= 0) return;
    await new Promise<void>((resolve) => setTimeout(resolve, remainingMs));
  }

  private backoff(bot: RuntimeDiscordBot, durationMs: number): void {
    bot.waitUntilMs = Math.max(bot.waitUntilMs, Date.now() + durationMs);
  }

  private updateRateLimitState(bot: RuntimeDiscordBot, response: Response): void {
    const remaining = Number(response.headers.get('x-ratelimit-remaining'));
    if (!Number.isFinite(remaining) || remaining !== 0) return;

    const resetAfterSeconds = Number(response.headers.get('x-ratelimit-reset-after'));
    if (!Number.isFinite(resetAfterSeconds) || resetAfterSeconds <= 0) return;
    this.backoff(bot, resetAfterSeconds * 1000);
  }

  private async parseRetryAfterMs(response: Response): Promise<number> {
    try {
      const payload = (await response.json()) as { retry_after?: unknown };
      if (typeof payload.retry_after === 'number' && payload.retry_after > 0) return payload.retry_after * 1000;
    } catch {
      // Fall through to Retry-After header.
    }

    const retryAfter = Number(response.headers.get('retry-after'));
    if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;
    return 1000;
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async readMessage(response: Response): Promise<DiscordMessage> {
    const payload = (await response.json()) as DiscordMessage;
    if (!payload || typeof payload.id !== 'string' || !Array.isArray(payload.attachments)) throw new DiscordApiError(response.status, 'Discord returned an invalid message payload');
    return payload;
  }

  private async createApiError(response: Response, prefix: string): Promise<DiscordApiError> {
    let body = '';

    try {
      body = (await response.text()).slice(0, 4096);
    } catch {
      // Ignore response body read failure.
    }

    return new DiscordApiError(response.status, body ? `${prefix}: ${body}` : prefix);
  }

  private postAttachment(bot: RuntimeDiscordBot, filename: string, content: Buffer): Promise<Response> {
    const form = new FormData();
    form.append('files[0]', new Blob([Uint8Array.from(content)]), filename);

    return this.fetchWithTimeout(`${this.baseUrl}/channels/${this.channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${bot.token}` },
      body: form,
    });
  }
}