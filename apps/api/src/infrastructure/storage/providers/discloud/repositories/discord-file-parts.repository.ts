import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

export interface CreateDiscordFilePartInput {
  fileObjectId: string;
  chunkId: string;
  ordinal: number;
}

@Injectable()
export class DiscordFilePartsRepository {
  constructor(private readonly prisma: PrismaService) { }

  create(input: CreateDiscordFilePartInput, db: DbClient = this.prisma) {
    return db.discordFilePart.create({
      data: {
        fileObjectId: input.fileObjectId,
        chunkId: input.chunkId,
        ordinal: input.ordinal,
      },
    });
  }

  findByFileObjectId(fileObjectId: string, db: DbClient = this.prisma) {
    return db.discordFilePart.findMany({
      where: { fileObjectId },
      orderBy: { ordinal: 'asc' },
      include: { chunk: true },
    });
  }

  countByChunkId(chunkId: string, db: DbClient = this.prisma) {
    return db.discordFilePart.count({
      where: { chunkId },
    });
  }

  deleteByFileObjectId(fileObjectId: string, db: DbClient = this.prisma) {
    return db.discordFilePart.deleteMany({
      where: { fileObjectId },
    });
  }

  async existsForFileObject(fileObjectId: string, db: DbClient = this.prisma): Promise<boolean> {
    const part = await db.discordFilePart.findFirst({
      where: { fileObjectId },
      select: { id: true },
    });

    return part !== null;
  }
}