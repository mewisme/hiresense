import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StorageProvider } from '../../storage-provider.interface';
import type { StoredObject, StoredObjectStream, StorageObjectReference, StoragePutInput } from '../../storage.types';
import { DiscordClient } from './discord/discord.client';
import { DiscordAttachmentGoneError } from './discord/discord.errors';
import { DiscloudChunkUnavailableError, DiscloudUploadConflictError } from './discloud-storage.errors';
import { DiscordChunksRepository } from './repositories/discord-chunks.repository';
import { DiscordFilePartsRepository } from './repositories/discord-file-parts.repository';
import { hashChunk } from './transfer/chunk-hash';
import { chunkStream } from './transfer/chunk-stream';

type StoredChunk = Awaited<ReturnType<DiscordChunksRepository['markActive']>>;
type FileParts = Awaited<ReturnType<DiscordFilePartsRepository['findByFileObjectId']>>;

@Injectable()
export class DisCloudStorageProvider implements StorageProvider {
  readonly code = 'DISCLOUD';

  private readonly channelId: string;
  private readonly chunkSize: number;
  private readonly uploadWorkers: number;

  constructor(
    configService: ConfigService,
    private readonly discordClient: DiscordClient,
    private readonly chunksRepository: DiscordChunksRepository,
    private readonly partsRepository: DiscordFilePartsRepository,
  ) {
    this.channelId = configService.getOrThrow<string>('storage.discloud.channelId');
    this.chunkSize = configService.getOrThrow<number>('storage.discloud.chunkSizeBytes');
    this.uploadWorkers = configService.getOrThrow<number>('storage.discloud.uploadWorkers');
  }

  async put(input: StoragePutInput): Promise<StoredObject> {
    if (input.sizeBytes <= 0n) throw new Error('DisCloud cannot store an empty object');

    const alreadyStarted = await this.partsRepository.existsForFileObject(input.fileObjectId);
    if (alreadyStarted) throw new Error(`DisCloud upload already has persisted parts for file object ${input.fileObjectId}`);

    const wholeFileHash = createHash('sha256');
    const active = new Set<Promise<void>>();
    const inFlightChunks = new Map<string, Promise<StoredChunk>>();
    let actualSize = 0n;
    let ordinal = 0;
    let failure: { error: unknown } | undefined;

    for await (const chunk of chunkStream(input.content, this.chunkSize)) {
      if (failure) break;

      const currentOrdinal = ordinal++;
      const sha256 = hashChunk(chunk);

      actualSize += BigInt(chunk.length);
      wholeFileHash.update(chunk);

      const task = this.persistPart(input.fileObjectId, sha256, chunk, currentOrdinal, inFlightChunks).catch((error) => {
        failure ??= { error };
      });

      active.add(task);
      void task.then(() => active.delete(task));

      if (active.size >= this.uploadWorkers) {
        await Promise.race(active);
        if (failure) break;
      }
    }

    await Promise.all(active);
    if (failure) throw failure.error;

    if (actualSize !== input.sizeBytes) {
      throw new Error(`Storage input size mismatch: expected ${input.sizeBytes.toString()} bytes, received ${actualSize.toString()} bytes`);
    }

    return {
      provider: this.code,
      bucket: input.bucket,
      objectKey: input.objectKey,
      sizeBytes: actualSize,
      contentType: input.contentType,
      sha256: wholeFileHash.digest('hex'),
    };
  }

  async get(reference: StorageObjectReference): Promise<StoredObjectStream> {
    const parts = await this.partsRepository.findByFileObjectId(reference.fileObjectId);
    if (parts.length === 0) throw new Error(`No DisCloud parts found for file object ${reference.fileObjectId}`);

    return {
      stream: Readable.from(this.readParts(parts)),
      contentType: reference.contentType ?? 'application/octet-stream',
      sizeBytes: parts.reduce((total, part) => total + part.chunk.sizeBytes, 0n),
    };
  }

  async exists(reference: StorageObjectReference): Promise<boolean> {
    const parts = await this.partsRepository.findByFileObjectId(reference.fileObjectId);
    if (parts.length === 0) return false;

    return parts.every((part) => part.chunk.status === 'ACTIVE' && part.chunk.deletedAt === null);
  }

  async delete(reference: StorageObjectReference): Promise<void> {
    const parts = await this.partsRepository.findByFileObjectId(reference.fileObjectId);
    if (parts.length === 0) return;

    const chunks = new Map(parts.map((part) => [part.chunk.id, part.chunk] as const));
    const localReferenceCounts = new Map<string, number>();

    for (const part of parts) {
      localReferenceCounts.set(part.chunk.id, (localReferenceCounts.get(part.chunk.id) ?? 0) + 1);
    }

    for (const chunk of chunks.values()) {
      const totalReferenceCount = await this.partsRepository.countByChunkId(chunk.id);
      const localReferenceCount = localReferenceCounts.get(chunk.id) ?? 0;

      if (totalReferenceCount > localReferenceCount) continue;

      if (chunk.status === 'ACTIVE' && chunk.messageId && chunk.botKey) {
        await this.discordClient.deleteMessage(chunk.messageId, chunk.botKey);
      }

      if (chunk.status !== 'DELETED') await this.chunksRepository.markDeleted(chunk.id);
    }

    await this.partsRepository.deleteByFileObjectId(reference.fileObjectId);
  }

  private async persistPart(
    fileObjectId: string,
    sha256: string,
    content: Buffer,
    ordinal: number,
    inFlightChunks: Map<string, Promise<StoredChunk>>,
  ): Promise<void> {
    const chunk = await this.resolveSharedChunk(sha256, content, ordinal, inFlightChunks);

    await this.partsRepository.create({
      fileObjectId,
      chunkId: chunk.id,
      ordinal,
    });
  }

  private resolveSharedChunk(
    sha256: string,
    content: Buffer,
    ordinal: number,
    inFlightChunks: Map<string, Promise<StoredChunk>>,
  ): Promise<StoredChunk> {
    const existing = inFlightChunks.get(sha256);
    if (existing) return existing;

    const task = this.resolveChunk(sha256, content, ordinal);
    inFlightChunks.set(sha256, task);

    void task.then(
      () => {
        if (inFlightChunks.get(sha256) === task) inFlightChunks.delete(sha256);
      },
      () => {
        if (inFlightChunks.get(sha256) === task) inFlightChunks.delete(sha256);
      },
    );

    return task;
  }

  private async resolveChunk(sha256: string, content: Buffer, ordinal: number): Promise<StoredChunk> {
    const existing = await this.chunksRepository.findByHash(this.channelId, sha256);

    if (existing) {
      if (existing.status === 'ACTIVE' && existing.deletedAt === null) return existing;
      if (existing.status === 'UPLOADING') throw new DiscloudUploadConflictError(sha256);

      if (existing.status === 'FAILED' || existing.status === 'MISSING' || existing.status === 'DELETED') {
        await this.chunksRepository.reclaim(existing.id, BigInt(content.length));
        return this.uploadChunk(existing.id, sha256, content, ordinal);
      }

      throw new DiscloudChunkUnavailableError(sha256);
    }

    let claimed: StoredChunk;

    try {
      claimed = await this.chunksRepository.createUploading({
        channelId: this.channelId,
        sha256,
        sizeBytes: BigInt(content.length),
      }) as StoredChunk;
    } catch (error) {
      const raced = await this.chunksRepository.findByHash(this.channelId, sha256);

      if (raced?.status === 'ACTIVE' && raced.deletedAt === null) return raced;
      if (raced?.status === 'UPLOADING') throw new DiscloudUploadConflictError(sha256);

      throw error;
    }

    return this.uploadChunk(claimed.id, sha256, content, ordinal);
  }

  private async uploadChunk(chunkId: string, sha256: string, content: Buffer, ordinal: number): Promise<StoredChunk> {
    let uploaded: Awaited<ReturnType<DiscordClient['uploadChunk']>> | undefined;

    try {
      uploaded = await this.discordClient.uploadChunk(this.createChunkFilename(sha256, ordinal), content);

      return await this.chunksRepository.markActive(chunkId, {
        messageId: uploaded.messageId,
        attachmentId: uploaded.attachmentId,
        attachmentFilename: uploaded.filename,
        botKey: uploaded.botKey,
      });
    } catch (error) {
      if (uploaded) {
        try {
          await this.discordClient.deleteMessage(uploaded.messageId, uploaded.botKey);
        } catch {
          // Best-effort compensation.
        }
      }

      try {
        await this.chunksRepository.markFailed(chunkId);
      } catch {
        // Preserve original upload/storage error.
      }

      throw error;
    }
  }

  private async *readParts(parts: FileParts): AsyncGenerator<Buffer> {
    for (const part of parts) {
      const chunk = part.chunk;

      if (chunk.status !== 'ACTIVE' || !chunk.messageId || !chunk.attachmentId || !chunk.botKey) {
        throw new DiscloudChunkUnavailableError(chunk.sha256);
      }

      let url: string;

      try {
        url = await this.discordClient.getAttachmentUrl(chunk.messageId, chunk.attachmentId, chunk.botKey);
      } catch (error) {
        if (error instanceof DiscordAttachmentGoneError) await this.chunksRepository.markMissing(chunk.id);
        throw error;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to download Discord chunk ${chunk.sha256}: HTTP ${response.status}`);

      const content = Buffer.from(await response.arrayBuffer());
      if (hashChunk(content) !== chunk.sha256) throw new Error(`Discord chunk integrity check failed: ${chunk.sha256}`);

      yield content;
    }
  }

  private createChunkFilename(sha256: string, ordinal: number): string {
    return `${ordinal.toString().padStart(6, '0')}.${sha256}.chunk`;
  }
}