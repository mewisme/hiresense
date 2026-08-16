import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { ConfigService } from '@nestjs/config';
import { DiscordClient } from './discord.client';
import { DiscordAttachmentGoneError } from './discord.errors';

function createConfigService(): ConfigService {
  const values: Record<string, unknown> = {
    'storage.discloud.apiBaseUrl': 'https://discord.test/api/v10',
    'storage.discloud.channelId': 'channel-1',
    'storage.discloud.bots': [
      { key: 'bot-a', token: 'token-a' },
      { key: 'bot-b', token: 'token-b' },
      { key: 'bot-c', token: 'token-c' },
    ],
    'storage.discloud.requestTimeoutMs': 10_000,
    'storage.discloud.maxAttempts': 5,
  };

  return {
    get: jest.fn((key: string) => values[key]),
    getOrThrow: jest.fn((key: string) => {
      const value = values[key];

      if (value === undefined) {
        throw new Error(`Missing ${key}`);
      }

      return value;
    }),
  } as unknown as ConfigService;
}

function uploadResponse(messageId: string, attachmentId: string): Response {
  return new Response(
    JSON.stringify({
      id: messageId,
      attachments: [
        {
          id: attachmentId,
          url: `https://cdn.test/${attachmentId}`,
          filename: 'chunk.bin',
        },
      ],
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    },
  );
}

describe('DiscordClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rotates physical uploads between configured bots', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');

    fetchMock
      .mockResolvedValueOnce(uploadResponse('message-1', 'attachment-1'))
      .mockResolvedValueOnce(uploadResponse('message-2', 'attachment-2'))
      .mockResolvedValueOnce(uploadResponse('message-3', 'attachment-3'))
      .mockResolvedValueOnce(uploadResponse('message-4', 'attachment-4'));

    const client = new DiscordClient(createConfigService());

    const first = await client.uploadChunk('chunk.bin', Buffer.from('a'));
    const second = await client.uploadChunk('chunk.bin', Buffer.from('b'));
    const third = await client.uploadChunk('chunk.bin', Buffer.from('c'));
    const fourth = await client.uploadChunk('chunk.bin', Buffer.from('d'));

    expect([first.botKey, second.botKey, third.botKey, fourth.botKey]).toEqual([
      'bot-a',
      'bot-b',
      'bot-c',
      'bot-a',
    ]);
  });

  it('moves to the next bot when an upload attempt fails', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ retry_after: 0.001 }), {
          status: 429,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response('server error', { status: 500 }))
      .mockResolvedValueOnce(uploadResponse('message-1', 'attachment-1'));

    const client = new DiscordClient(createConfigService());
    const result = await client.uploadChunk('chunk.bin', Buffer.from('abc'));

    expect(result.botKey).toBe('bot-c');
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const firstHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    const secondHeaders = fetchMock.mock.calls[1]?.[1]?.headers as Record<string, string>;
    const thirdHeaders = fetchMock.mock.calls[2]?.[1]?.headers as Record<string, string>;

    expect(firstHeaders.Authorization).toBe('Bot token-a');
    expect(secondHeaders.Authorization).toBe('Bot token-b');
    expect(thirdHeaders.Authorization).toBe('Bot token-c');
  });

  it('throws when attachment is gone', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status: 404 }));

    const client = new DiscordClient(createConfigService());

    await expect(
      client.getAttachmentUrl('message-404', 'attachment-404', 'bot-a'),
    ).rejects.toBeInstanceOf(DiscordAttachmentGoneError);
  });

  it('treats deleting an already missing message as success', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status: 404 }));

    const client = new DiscordClient(createConfigService());

    await expect(client.deleteMessage('message-404', 'bot-a')).resolves.toBeUndefined();
  });

  it('returns the requested attachment URL', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'message-1',
          attachments: [
            { id: 'attachment-a', filename: 'a.chunk', url: 'https://cdn.test/a' },
            { id: 'attachment-b', filename: 'b.chunk', url: 'https://cdn.test/b' },
          ],
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      ),
    );

    const client = new DiscordClient(createConfigService());

    await expect(
      client.getAttachmentUrl('message-1', 'attachment-b', 'bot-a'),
    ).resolves.toBe('https://cdn.test/b');
  });
});