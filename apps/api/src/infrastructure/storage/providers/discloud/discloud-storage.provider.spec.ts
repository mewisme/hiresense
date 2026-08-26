import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { ConfigService } from '@nestjs/config';
import { DiscordClient } from './discord/discord.client';
import { DisCloudStorageProvider } from './discloud-storage.provider';
import { DiscordChunksRepository } from './repositories/discord-chunks.repository';
import { DiscordFilePartsRepository } from './repositories/discord-file-parts.repository';

interface MockChunk {
  id: string;
  channelId: string;
  sha256: string;
  sizeBytes: bigint;
  status: string;
  messageId: string | null;
  attachmentId: string | null;
  attachmentFilename: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface MockFilePart {
  ordinal: number;
  chunk: MockChunk;
}

interface MockDiscordUploadResult {
  messageId: string;
  attachmentId: string;
  filename: string;
}

interface CreateChunkInput {
  channelId: string;
  sha256: string;
  sizeBytes: bigint;
}

interface MarkChunkActiveInput {
  messageId: string;
  attachmentId: string;
  attachmentFilename: string;
}

interface CreatePartInput {
  fileObjectId: string;
  chunkId: string;
  ordinal: number;
}

function sha256(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

function createConfigService(): ConfigService {
  const values: Record<string, unknown> = {
    'storage.discloud.channelId': 'channel-1',
    'storage.discloud.chunkSizeBytes': 3,
    'storage.discloud.uploadWorkers': 2,
  };

  return {
    getOrThrow: jest.fn((key: string) => {
      const value = values[key];
      if (value === undefined) throw new Error(`Missing config: ${key}`);
      return value;
    }),
  } as unknown as ConfigService;
}

function uploadingChunk(content: string | Buffer = 'abc', overrides: Partial<MockChunk> = {}): MockChunk {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);

  return {
    id: 'chunk-1',
    channelId: 'channel-1',
    sha256: sha256(buffer),
    sizeBytes: BigInt(buffer.length),
    status: 'UPLOADING',
    messageId: null,
    attachmentId: null,
    attachmentFilename: null,
    createdAt: new Date('2026-08-16T00:00:00.000Z'),
    updatedAt: new Date('2026-08-16T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function activeChunk(content: string | Buffer = 'abc', overrides: Partial<MockChunk> = {}): MockChunk {
  return uploadingChunk(content, {
    status: 'ACTIVE',
    messageId: 'message-1',
    attachmentId: 'attachment-1',
    attachmentFilename: 'chunk.bin',
    ...overrides,
  });
}

function createUploadMocks() {
  const uploadChunk = jest.fn<(filename: string, content: Buffer) => Promise<MockDiscordUploadResult>>();
  const getAttachmentUrl = jest.fn<(messageId: string, attachmentId: string) => Promise<string>>();
  const deleteMessage = jest.fn<(messageId: string) => Promise<void>>();

  const findByHash = jest.fn<(channelId: string, chunkSha256: string) => Promise<MockChunk | null>>();
  const createUploading = jest.fn<(input: CreateChunkInput) => Promise<MockChunk>>();
  const markActive = jest.fn<(chunkId: string, input: MarkChunkActiveInput) => Promise<MockChunk>>();
  const markFailed = jest.fn<(chunkId: string) => Promise<MockChunk>>();
  const markMissing = jest.fn<(chunkId: string) => Promise<MockChunk>>();
  const markDeleted = jest.fn<(chunkId: string) => Promise<MockChunk>>();
  const reclaim = jest.fn<(chunkId: string, sizeBytes: bigint) => Promise<MockChunk>>();

  const existsForFileObject = jest.fn<(fileObjectId: string) => Promise<boolean>>();
  const createPart = jest.fn<(input: CreatePartInput) => Promise<unknown>>();
  const findByFileObjectId = jest.fn<(fileObjectId: string) => Promise<MockFilePart[]>>();
  const countByChunkId = jest.fn<(chunkId: string) => Promise<number>>();
  const deleteByFileObjectId = jest.fn<(fileObjectId: string) => Promise<unknown>>();

  const discordClient = { uploadChunk, getAttachmentUrl, deleteMessage } as unknown as DiscordClient;

  const chunksRepository = {
    findByHash,
    createUploading,
    markActive,
    markFailed,
    markMissing,
    markDeleted,
    reclaim,
  } as unknown as DiscordChunksRepository;

  const partsRepository = {
    existsForFileObject,
    create: createPart,
    findByFileObjectId,
    countByChunkId,
    deleteByFileObjectId,
  } as unknown as DiscordFilePartsRepository;

  const provider = new DisCloudStorageProvider(createConfigService(), discordClient, chunksRepository, partsRepository);

  return {
    provider,
    mocks: {
      uploadChunk,
      getAttachmentUrl,
      deleteMessage,
      findByHash,
      createUploading,
      markActive,
      markFailed,
      markMissing,
      markDeleted,
      reclaim,
      existsForFileObject,
      createPart,
      findByFileObjectId,
      countByChunkId,
      deleteByFileObjectId,
    },
  };
}

describe('DisCloudStorageProvider', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uploads identical concurrent chunks only once and creates both file parts', async () => {
    const { provider, mocks } = createUploadMocks();
    const uploading = uploadingChunk();
    const active = activeChunk();

    mocks.existsForFileObject.mockImplementation(async () => false);
    mocks.findByHash.mockImplementation(async () => null);
    mocks.createUploading.mockImplementation(async () => uploading);
    mocks.uploadChunk.mockImplementation(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
      return {
        messageId: 'message-1',
        attachmentId: 'attachment-1',
        filename: 'chunk.bin',
      };
    });
    mocks.markActive.mockImplementation(async () => active);
    mocks.createPart.mockImplementation(async () => undefined);

    const result = await provider.put({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000001',
      bucket: 'resumes',
      objectKey: 'users/user-1/resumes/test.pdf',
      content: Readable.from([Buffer.from('abcabc')]),
      contentType: 'application/pdf',
      sizeBytes: 6n,
    });

    expect(mocks.uploadChunk).toHaveBeenCalledTimes(1);
    expect(mocks.createUploading).toHaveBeenCalledTimes(1);
    expect(mocks.createPart).toHaveBeenCalledTimes(2);

    expect(mocks.createPart).toHaveBeenCalledWith({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000001',
      chunkId: 'chunk-1',
      ordinal: 0,
    });

    expect(mocks.createPart).toHaveBeenCalledWith({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000001',
      chunkId: 'chunk-1',
      ordinal: 1,
    });

    expect(result.provider).toBe('DISCLOUD');
    expect(result.bucket).toBe('resumes');
    expect(result.objectKey).toBe('users/user-1/resumes/test.pdf');
    expect(result.contentType).toBe('application/pdf');
    expect(result.sizeBytes).toBe(6n);
    expect(result.sha256).toBe(sha256('abcabc'));
  });

  it('reuses an existing ACTIVE chunk without uploading to Discord', async () => {
    const { provider, mocks } = createUploadMocks();
    const existing = activeChunk('abc', { id: 'chunk-existing' });

    mocks.existsForFileObject.mockImplementation(async () => false);
    mocks.findByHash.mockImplementation(async () => existing);
    mocks.createPart.mockImplementation(async () => undefined);

    const result = await provider.put({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000002',
      bucket: 'resumes',
      objectKey: 'users/user-1/resumes/reused.pdf',
      content: Readable.from([Buffer.from('abc')]),
      contentType: 'application/pdf',
      sizeBytes: 3n,
    });

    expect(mocks.uploadChunk).not.toHaveBeenCalled();
    expect(mocks.createUploading).not.toHaveBeenCalled();
    expect(mocks.createPart).toHaveBeenCalledTimes(1);
    expect(mocks.createPart).toHaveBeenCalledWith({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000002',
      chunkId: 'chunk-existing',
      ordinal: 0,
    });
    expect(result.sha256).toBe(sha256('abc'));
  });

  it('rejects an upload when parts already exist for the file object', async () => {
    const { provider, mocks } = createUploadMocks();

    mocks.existsForFileObject.mockImplementation(async () => true);

    await expect(provider.put({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000003',
      bucket: 'resumes',
      objectKey: 'users/user-1/resumes/existing.pdf',
      content: Readable.from([Buffer.from('abc')]),
      contentType: 'application/pdf',
      sizeBytes: 3n,
    })).rejects.toThrow('already has persisted parts');

    expect(mocks.findByHash).not.toHaveBeenCalled();
    expect(mocks.uploadChunk).not.toHaveBeenCalled();
  });

  it('rejects an empty object', async () => {
    const { provider, mocks } = createUploadMocks();

    await expect(provider.put({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000004',
      bucket: 'resumes',
      objectKey: 'users/user-1/resumes/empty.pdf',
      content: Readable.from([]),
      contentType: 'application/pdf',
      sizeBytes: 0n,
    })).rejects.toThrow('cannot store an empty object');

    expect(mocks.existsForFileObject).not.toHaveBeenCalled();
    expect(mocks.uploadChunk).not.toHaveBeenCalled();
  });

  it('rejects when the actual stream size differs from the declared size', async () => {
    const { provider, mocks } = createUploadMocks();

    mocks.existsForFileObject.mockImplementation(async () => false);
    mocks.findByHash.mockImplementation(async () => null);
    mocks.createUploading.mockImplementation(async () => uploadingChunk());
    mocks.uploadChunk.mockImplementation(async () => ({
      messageId: 'message-1',
      attachmentId: 'attachment-1',
      filename: 'chunk.bin',
    }));
    mocks.markActive.mockImplementation(async () => activeChunk());
    mocks.createPart.mockImplementation(async () => undefined);

    await expect(provider.put({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000005',
      bucket: 'resumes',
      objectKey: 'users/user-1/resumes/size-mismatch.pdf',
      content: Readable.from([Buffer.from('abc')]),
      contentType: 'application/pdf',
      sizeBytes: 100n,
    })).rejects.toThrow('Storage input size mismatch');
  });

  it('marks a chunk FAILED when Discord upload fails', async () => {
    const { provider, mocks } = createUploadMocks();
    const uploading = uploadingChunk();

    mocks.existsForFileObject.mockImplementation(async () => false);
    mocks.findByHash.mockImplementation(async () => null);
    mocks.createUploading.mockImplementation(async () => uploading);
    mocks.uploadChunk.mockImplementation(async () => {
      throw new Error('Discord upload failed');
    });
    mocks.markFailed.mockImplementation(async () => ({
      ...uploading,
      status: 'FAILED',
    }));

    await expect(provider.put({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000006',
      bucket: 'resumes',
      objectKey: 'users/user-1/resumes/fail.pdf',
      content: Readable.from([Buffer.from('abc')]),
      contentType: 'application/pdf',
      sizeBytes: 3n,
    })).rejects.toThrow('Discord upload failed');

    expect(mocks.markFailed).toHaveBeenCalledTimes(1);
    expect(mocks.markFailed).toHaveBeenCalledWith('chunk-1');
    expect(mocks.createPart).not.toHaveBeenCalled();
  });

  it('reclaims a FAILED chunk before uploading it again', async () => {
    const { provider, mocks } = createUploadMocks();

    const failed = uploadingChunk('abc', {
      id: 'chunk-failed',
      status: 'FAILED',
    });

    const reclaimed = {
      ...failed,
      status: 'UPLOADING',
      deletedAt: null,
    };

    const active = activeChunk('abc', {
      id: 'chunk-failed',
    });

    mocks.existsForFileObject.mockImplementation(async () => false);
    mocks.findByHash.mockImplementation(async () => failed);
    mocks.reclaim.mockImplementation(async () => reclaimed);
    mocks.uploadChunk.mockImplementation(async () => ({
      messageId: 'message-2',
      attachmentId: 'attachment-2',
      filename: 'chunk.bin',
    }));
    mocks.markActive.mockImplementation(async () => active);
    mocks.createPart.mockImplementation(async () => undefined);

    await provider.put({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000007',
      bucket: 'resumes',
      objectKey: 'users/user-1/resumes/reclaimed.pdf',
      content: Readable.from([Buffer.from('abc')]),
      contentType: 'application/pdf',
      sizeBytes: 3n,
    });

    expect(mocks.reclaim).toHaveBeenCalledWith('chunk-failed', 3n);
    expect(mocks.uploadChunk).toHaveBeenCalledTimes(1);
    expect(mocks.createUploading).not.toHaveBeenCalled();
    expect(mocks.createPart).toHaveBeenCalledWith({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000007',
      chunkId: 'chunk-failed',
      ordinal: 0,
    });
  });

  it('downloads chunks in ordinal order and verifies their hashes', async () => {
    const { provider, mocks } = createUploadMocks();
    const first = Buffer.from('abc');
    const second = Buffer.from('def');

    mocks.findByFileObjectId.mockImplementation(async () => [
      {
        ordinal: 0,
        chunk: activeChunk(first, {
          id: 'chunk-1',
          messageId: 'message-1',
          attachmentId: 'attachment-1',
        }),
      },
      {
        ordinal: 1,
        chunk: activeChunk(second, {
          id: 'chunk-2',
          messageId: 'message-2',
          attachmentId: 'attachment-2',
        }),
      },
    ]);

    mocks.getAttachmentUrl.mockImplementation(async (messageId) => {
      if (messageId === 'message-1') return 'https://cdn.test/first';
      if (messageId === 'message-2') return 'https://cdn.test/second';
      throw new Error('Unexpected message id');
    });

    const fetchMock = jest.spyOn(globalThis, 'fetch');
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);

      if (url === 'https://cdn.test/first') return new Response(Uint8Array.from(first), { status: 200 });
      if (url === 'https://cdn.test/second') return new Response(Uint8Array.from(second), { status: 200 });

      return new Response('not found', { status: 404 });
    });

    const stored = await provider.get({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000008',
      provider: 'DISCLOUD',
      bucket: 'resumes',
      objectKey: 'users/user-1/resumes/download.pdf',
      contentType: 'application/pdf',
    });

    const buffers: Buffer[] = [];

    for await (const value of stored.stream) {
      buffers.push(Buffer.isBuffer(value) ? value : Buffer.from(value));
    }

    expect(Buffer.concat(buffers).toString()).toBe('abcdef');
    expect(stored.contentType).toBe('application/pdf');
    expect(stored.sizeBytes).toBe(6n);

    expect(mocks.getAttachmentUrl).toHaveBeenNthCalledWith(1, 'message-1', 'attachment-1');

    expect(mocks.getAttachmentUrl).toHaveBeenNthCalledWith(2, 'message-2', 'attachment-2');
  });

  it('rejects a downloaded chunk whose bytes do not match its SHA-256', async () => {
    const { provider, mocks } = createUploadMocks();

    mocks.findByFileObjectId.mockImplementation(async () => [
      {
        ordinal: 0,
        chunk: activeChunk('expected', {
          id: 'chunk-1',
          messageId: 'message-1',
          attachmentId: 'attachment-1',
        }),
      },
    ]);

    mocks.getAttachmentUrl.mockImplementation(async () => 'https://cdn.test/chunk');

    jest.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(Uint8Array.from(Buffer.from('corrupted')), { status: 200 });
    });

    const stored = await provider.get({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000009',
      provider: 'DISCLOUD',
      bucket: 'resumes',
      objectKey: 'users/user-1/resumes/corrupted.pdf',
      contentType: 'application/pdf',
    });

    await expect((async () => {
      for await (const value of stored.stream) void value;
    })()).rejects.toThrow('Discord chunk integrity check failed');
  });

  it('returns false from exists when no parts exist', async () => {
    const { provider, mocks } = createUploadMocks();

    mocks.findByFileObjectId.mockImplementation(async () => []);

    const result = await provider.exists({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000010',
      provider: 'DISCLOUD',
      bucket: 'resumes',
      objectKey: 'users/user-1/resumes/missing.pdf',
      contentType: 'application/pdf',
    });

    expect(result).toBe(false);
  });

  it('returns true from exists when every chunk is ACTIVE', async () => {
    const { provider, mocks } = createUploadMocks();

    mocks.findByFileObjectId.mockImplementation(async () => [
      {
        ordinal: 0,
        chunk: activeChunk('abc', { id: 'chunk-1' }),
      },
      {
        ordinal: 1,
        chunk: activeChunk('def', { id: 'chunk-2' }),
      },
    ]);

    const result = await provider.exists({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000011',
      provider: 'DISCLOUD',
      bucket: 'resumes',
      objectKey: 'users/user-1/resumes/existing.pdf',
      contentType: 'application/pdf',
    });

    expect(result).toBe(true);
  });

  it('returns false from exists when at least one chunk is not ACTIVE', async () => {
    const { provider, mocks } = createUploadMocks();

    mocks.findByFileObjectId.mockImplementation(async () => [
      {
        ordinal: 0,
        chunk: activeChunk('abc', { id: 'chunk-1' }),
      },
      {
        ordinal: 1,
        chunk: uploadingChunk('def', {
          id: 'chunk-2',
          status: 'MISSING',
        }),
      },
    ]);

    const result = await provider.exists({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000012',
      provider: 'DISCLOUD',
      bucket: 'resumes',
      objectKey: 'users/user-1/resumes/incomplete.pdf',
      contentType: 'application/pdf',
    });

    expect(result).toBe(false);
  });

  it('does not physically delete a chunk that is still referenced by another file', async () => {
    const { provider, mocks } = createUploadMocks();
    const chunk = activeChunk();

    mocks.findByFileObjectId.mockImplementation(async () => [
      { ordinal: 0, chunk },
    ]);
    mocks.countByChunkId.mockImplementation(async () => 2);
    mocks.deleteByFileObjectId.mockImplementation(async () => undefined);

    await provider.delete({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000013',
      provider: 'DISCLOUD',
      bucket: 'resumes',
      objectKey: 'users/user-1/resumes/shared.pdf',
      contentType: 'application/pdf',
    });

    expect(mocks.deleteMessage).not.toHaveBeenCalled();
    expect(mocks.markDeleted).not.toHaveBeenCalled();
    expect(mocks.deleteByFileObjectId).toHaveBeenCalledWith(
      '0198c8e8-8abc-7000-8000-000000000013',
    );
  });

  it('physically deletes an unreferenced ACTIVE chunk before deleting file parts', async () => {
    const { provider, mocks } = createUploadMocks();
    const chunk = activeChunk();

    mocks.findByFileObjectId.mockImplementation(async () => [
      { ordinal: 0, chunk },
    ]);
    mocks.countByChunkId.mockImplementation(async () => 1);
    mocks.deleteMessage.mockImplementation(async () => undefined);
    mocks.markDeleted.mockImplementation(async () => ({
      ...chunk,
      status: 'DELETED',
      deletedAt: new Date(),
    }));
    mocks.deleteByFileObjectId.mockImplementation(async () => undefined);

    await provider.delete({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000014',
      provider: 'DISCLOUD',
      bucket: 'resumes',
      objectKey: 'users/user-1/resumes/unreferenced.pdf',
      contentType: 'application/pdf',
    });

    expect(mocks.deleteMessage).toHaveBeenCalledWith('message-1');
    expect(mocks.markDeleted).toHaveBeenCalledWith('chunk-1');
    expect(mocks.deleteByFileObjectId).toHaveBeenCalledWith(
      '0198c8e8-8abc-7000-8000-000000000014',
    );

    const physicalDeleteOrder = mocks.deleteMessage.mock.invocationCallOrder[0];
    const partDeleteOrder = mocks.deleteByFileObjectId.mock.invocationCallOrder[0];

    expect(physicalDeleteOrder).toBeDefined();
    expect(partDeleteOrder).toBeDefined();
    expect(physicalDeleteOrder!).toBeLessThan(partDeleteOrder!);
  });

  it('does nothing when deleting a file object with no parts', async () => {
    const { provider, mocks } = createUploadMocks();

    mocks.findByFileObjectId.mockImplementation(async () => []);

    await provider.delete({
      fileObjectId: '0198c8e8-8abc-7000-8000-000000000015',
      provider: 'DISCLOUD',
      bucket: 'resumes',
      objectKey: 'users/user-1/resumes/no-parts.pdf',
      contentType: 'application/pdf',
    });

    expect(mocks.countByChunkId).not.toHaveBeenCalled();
    expect(mocks.deleteMessage).not.toHaveBeenCalled();
    expect(mocks.markDeleted).not.toHaveBeenCalled();
    expect(mocks.deleteByFileObjectId).not.toHaveBeenCalled();
  });
});