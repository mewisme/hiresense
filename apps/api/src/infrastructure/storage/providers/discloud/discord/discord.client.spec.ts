import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { DiscordClient } from './discord.client';
import { DiscordAttachmentGoneError } from './discord.errors';

function createConfigService(maxAttempts = 5): ConfigService {
  const values: Record<string, unknown> = {
    'storage.discloud.apiBaseUrl': 'https://discord.test/api/v10',
    'storage.discloud.channelId': 'channel-1',
    'storage.discloud.bots': [
      { key: 'bot-a', token: 'token-a' },
      { key: 'bot-b', token: 'token-b' },
      { key: 'bot-c', token: 'token-c' },
    ],
    'storage.discloud.requestTimeoutMs': 5_000,
    'storage.discloud.maxAttempts': maxAttempts,
  };

  return {
    get: jest.fn((key: string) => values[key]),
    getOrThrow: jest.fn((key: string) => {
      const value = values[key];
      if (value === undefined) throw new Error(`Missing config: ${key}`);
      return value;
    }),
  } as unknown as ConfigService;
}

function uploadResponse(messageId: string, attachmentId: string, filename = 'chunk.bin'): Response {
  return new Response(JSON.stringify({
    id: messageId,
    attachments: [{ id: attachmentId, filename, url: `https://cdn.test/${attachmentId}` }],
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}

function authorization(fetchMock: ReturnType<typeof jest.spyOn>, index: number): string | undefined {
  const headers = fetchMock.mock.calls[index]?.[1]?.headers as Record<string, string> | undefined;
  return headers?.Authorization;
}

describe('DiscordClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rotates bots between successful physical uploads', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(uploadResponse('message-1', 'attachment-1'))
      .mockResolvedValueOnce(uploadResponse('message-2', 'attachment-2'))
      .mockResolvedValueOnce(uploadResponse('message-3', 'attachment-3'))
      .mockResolvedValueOnce(uploadResponse('message-4', 'attachment-4'));

    const client = new DiscordClient(createConfigService());

    expect((await client.uploadChunk('1.chunk', Buffer.from('1'))).botKey).toBe('bot-a');
    expect((await client.uploadChunk('2.chunk', Buffer.from('2'))).botKey).toBe('bot-b');
    expect((await client.uploadChunk('3.chunk', Buffer.from('3'))).botKey).toBe('bot-c');
    expect((await client.uploadChunk('4.chunk', Buffer.from('4'))).botKey).toBe('bot-a');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('moves to the next bot after each failed upload attempt', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('failed-a', { status: 500 }))
      .mockResolvedValueOnce(new Response('failed-b', { status: 502 }))
      .mockResolvedValueOnce(uploadResponse('message-1', 'attachment-1'));

    const client = new DiscordClient(createConfigService());
    const result = await client.uploadChunk('chunk.bin', Buffer.from('abc'));

    expect(result.botKey).toBe('bot-c');
    expect(authorization(fetchMock, 0)).toBe('Bot token-a');
    expect(authorization(fetchMock, 1)).toBe('Bot token-b');
    expect(authorization(fetchMock, 2)).toBe('Bot token-c');
  });

  it('moves to the next bot when the current bot is rate limited', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ retry_after: 1 }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      }))
      .mockResolvedValueOnce(uploadResponse('message-1', 'attachment-1'));

    const client = new DiscordClient(createConfigService());
    const result = await client.uploadChunk('chunk.bin', Buffer.from('abc'));

    expect(result.botKey).toBe('bot-b');
    expect(authorization(fetchMock, 0)).toBe('Bot token-a');
    expect(authorization(fetchMock, 1)).toBe('Bot token-b');
  });

  it('wraps bot rotation when attempts exceed bot count', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('failed-a', { status: 500 }))
      .mockResolvedValueOnce(new Response('failed-b', { status: 500 }))
      .mockResolvedValueOnce(new Response('failed-c', { status: 500 }))
      .mockResolvedValueOnce(uploadResponse('message-1', 'attachment-1'));

    const client = new DiscordClient(createConfigService());
    const result = await client.uploadChunk('chunk.bin', Buffer.from('abc'));

    expect(result.botKey).toBe('bot-a');
    expect(authorization(fetchMock, 0)).toBe('Bot token-a');
    expect(authorization(fetchMock, 1)).toBe('Bot token-b');
    expect(authorization(fetchMock, 2)).toBe('Bot token-c');
    expect(authorization(fetchMock, 3)).toBe('Bot token-a');
  });

  it('fails only after maxAttempts are exhausted', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('failed-a', { status: 500 }))
      .mockResolvedValueOnce(new Response('failed-b', { status: 500 }))
      .mockResolvedValueOnce(new Response('failed-c', { status: 500 }));

    const client = new DiscordClient(createConfigService(3));

    await expect(client.uploadChunk('chunk.bin', Buffer.from('abc'))).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('finds the exact attachment using attachmentId', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({
      id: 'message-1',
      attachments: [
        { id: 'attachment-a', filename: 'a.chunk', url: 'https://cdn.test/a' },
        { id: 'attachment-b', filename: 'b.chunk', url: 'https://cdn.test/b' },
      ],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    const client = new DiscordClient(createConfigService());

    await expect(client.getAttachmentUrl('message-1', 'attachment-b', 'bot-a')).resolves.toBe('https://cdn.test/b');
  });

  it('throws when the requested attachment no longer exists', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({
      id: 'message-1',
      attachments: [],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    const client = new DiscordClient(createConfigService());

    await expect(client.getAttachmentUrl('message-1', 'missing', 'bot-a')).rejects.toBeInstanceOf(DiscordAttachmentGoneError);
  });
});