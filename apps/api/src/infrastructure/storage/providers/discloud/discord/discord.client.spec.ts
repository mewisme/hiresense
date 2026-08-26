import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { DiscordClient } from './discord.client';
import { DiscordAttachmentGoneError } from './discord.errors';

function createConfigService(maxAttempts = 5): ConfigService {
  const values: Record<string, unknown> = {
    'storage.discloud.apiBaseUrl': 'https://discord.test/api/v10',
    'storage.discloud.channelId': 'channel-1',
    'storage.discloud.bots': [
      { id: '100000000000000001', token: 'token-a' },
      { id: '100000000000000002', token: 'token-b' },
      { id: '100000000000000003', token: 'token-c' },
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
  afterEach(() => jest.restoreAllMocks());

  it('rotates bots between successful physical uploads', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(uploadResponse('message-1', 'attachment-1'))
      .mockResolvedValueOnce(uploadResponse('message-2', 'attachment-2'))
      .mockResolvedValueOnce(uploadResponse('message-3', 'attachment-3'))
      .mockResolvedValueOnce(uploadResponse('message-4', 'attachment-4'));
    const client = new DiscordClient(createConfigService());

    await client.uploadChunk('1.chunk', Buffer.from('1'));
    await client.uploadChunk('2.chunk', Buffer.from('2'));
    await client.uploadChunk('3.chunk', Buffer.from('3'));
    await client.uploadChunk('4.chunk', Buffer.from('4'));

    expect([0, 1, 2, 3].map((index) => authorization(fetchMock, index))).toEqual(['Bot token-a', 'Bot token-b', 'Bot token-c', 'Bot token-a']);
  });

  it('moves to the next bot after each failed upload attempt', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('failed-a', { status: 500 }))
      .mockResolvedValueOnce(new Response('failed-b', { status: 502 }))
      .mockResolvedValueOnce(uploadResponse('message-1', 'attachment-1'));
    const client = new DiscordClient(createConfigService());

    await expect(client.uploadChunk('chunk.bin', Buffer.from('abc'))).resolves.toMatchObject({ messageId: 'message-1', attachmentId: 'attachment-1' });
    expect([0, 1, 2].map((index) => authorization(fetchMock, index))).toEqual(['Bot token-a', 'Bot token-b', 'Bot token-c']);
  });

  it('moves to the next bot when the current bot is rate limited', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ retry_after: 1 }), { status: 429, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(uploadResponse('message-1', 'attachment-1'));
    const client = new DiscordClient(createConfigService());

    await client.uploadChunk('chunk.bin', Buffer.from('abc'));
    expect([0, 1].map((index) => authorization(fetchMock, index))).toEqual(['Bot token-a', 'Bot token-b']);
  });

  it('wraps bot rotation when attempts exceed bot count', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('failed-a', { status: 500 }))
      .mockResolvedValueOnce(new Response('failed-b', { status: 500 }))
      .mockResolvedValueOnce(new Response('failed-c', { status: 500 }))
      .mockResolvedValueOnce(uploadResponse('message-1', 'attachment-1'));
    const client = new DiscordClient(createConfigService());

    await client.uploadChunk('chunk.bin', Buffer.from('abc'));
    expect([0, 1, 2, 3].map((index) => authorization(fetchMock, index))).toEqual(['Bot token-a', 'Bot token-b', 'Bot token-c', 'Bot token-a']);
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

  it('reads a message with any available bot and finds the exact attachment', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('temporary failure', { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'message-1',
        attachments: [
          { id: 'attachment-a', filename: 'a.chunk', url: 'https://cdn.test/a' },
          { id: 'attachment-b', filename: 'b.chunk', url: 'https://cdn.test/b' },
        ],
      }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const client = new DiscordClient(createConfigService());

    await expect(client.getAttachmentUrl('message-1', 'attachment-b')).resolves.toBe('https://cdn.test/b');
    expect([0, 1].map((index) => authorization(fetchMock, index))).toEqual(['Bot token-a', 'Bot token-b']);
  });

  it('throws when the requested attachment no longer exists', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ id: 'message-1', attachments: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    const client = new DiscordClient(createConfigService());

    await expect(client.getAttachmentUrl('message-1', 'missing')).rejects.toBeInstanceOf(DiscordAttachmentGoneError);
  });

  it('deletes a message with another available bot when one bot cannot delete it', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('missing permission', { status: 403 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = new DiscordClient(createConfigService());

    await expect(client.deleteMessage('message-1')).resolves.toBeUndefined();
    expect([0, 1].map((index) => authorization(fetchMock, index))).toEqual(['Bot token-a', 'Bot token-b']);
  });
});