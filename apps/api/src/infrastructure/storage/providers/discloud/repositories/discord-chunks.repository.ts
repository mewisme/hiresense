import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

export interface CreateUploadingChunkInput {
  channelId: string;
  sha256: string;
  sizeBytes: bigint;
}

export interface ActivateChunkInput {
  messageId: string;
  attachmentId: string;
  attachmentFilename: string;
  botKey: string;
}

@Injectable()
export class DiscordChunksRepository {
  constructor(private readonly prisma: PrismaService) { }

  findById(id: string, db: DbClient = this.prisma) {
    return db.discordStorageChunk.findUnique({
      where: { id },
    });
  }

  findByHash(channelId: string, sha256: string, db: DbClient = this.prisma) {
    return db.discordStorageChunk.findUnique({
      where: {
        channelId_sha256: { channelId, sha256 },
      },
    });
  }

  findActiveByHash(channelId: string, sha256: string, db: DbClient = this.prisma) {
    return db.discordStorageChunk.findFirst({
      where: {
        channelId,
        sha256,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
  }

  createUploading(input: CreateUploadingChunkInput, db: DbClient = this.prisma) {
    return db.discordStorageChunk.create({
      data: {
        channelId: input.channelId,
        sha256: input.sha256,
        sizeBytes: input.sizeBytes,
        status: 'UPLOADING',
      },
    });
  }

  markActive(id: string, input: ActivateChunkInput, db: DbClient = this.prisma) {
    return db.discordStorageChunk.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        messageId: input.messageId,
        attachmentId: input.attachmentId,
        attachmentFilename: input.attachmentFilename,
        botKey: input.botKey,
        deletedAt: null,
      },
    });
  }

  markFailed(id: string, db: DbClient = this.prisma) {
    return db.discordStorageChunk.update({
      where: { id },
      data: { status: 'FAILED' },
    });
  }

  markMissing(id: string, db: DbClient = this.prisma) {
    return db.discordStorageChunk.update({
      where: { id },
      data: { status: 'MISSING' },
    });
  }

  markDeleted(id: string, db: DbClient = this.prisma) {
    return db.discordStorageChunk.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });
  }

  reclaim(id: string, sizeBytes: bigint, db: DbClient = this.prisma) {
    return db.discordStorageChunk.update({
      where: { id },
      data: {
        sizeBytes,
        status: 'UPLOADING',
        messageId: null,
        attachmentId: null,
        attachmentFilename: null,
        botKey: null,
        deletedAt: null,
      },
    });
  }
}