import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

export interface CreateFileObjectInput {
  storageProvider: string;
  bucket: string;
  objectKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: bigint;
  uploadedByUserId: string;
}

export interface CompleteFileObjectInput {
  sha256: string;
  sizeBytes: bigint;
}

@Injectable()
export class FileObjectsRepository {
  constructor(private readonly prisma: PrismaService) { }

  findById(id: string, db: DbClient = this.prisma) {
    return db.fileObject.findUnique({
      where: { id },
    });
  }

  findActiveById(id: string, db: DbClient = this.prisma) {
    return db.fileObject.findFirst({
      where: { id, status: 'ACTIVE', deletedAt: null },
    });
  }

  findByObjectReference(
    storageProvider: string,
    bucket: string,
    objectKey: string,
    db: DbClient = this.prisma,
  ) {
    return db.fileObject.findUnique({
      where: {
        storageProvider_bucket_objectKey: {
          storageProvider,
          bucket,
          objectKey,
        },
      },
    });
  }

  createUploading(input: CreateFileObjectInput, db: DbClient = this.prisma) {
    return db.fileObject.create({
      data: {
        storageProvider: input.storageProvider,
        bucket: input.bucket,
        objectKey: input.objectKey,
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        uploadedByUserId: input.uploadedByUserId,
        status: 'UPLOADING',
      },
    });
  }

  markActive(id: string, input: CompleteFileObjectInput, db: DbClient = this.prisma) {
    return db.fileObject.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        sha256: input.sha256,
        sizeBytes: input.sizeBytes,
      },
    });
  }

  markFailed(id: string, db: DbClient = this.prisma) {
    return db.fileObject.update({
      where: { id },
      data: { status: 'FAILED' },
    });
  }

  markDeleted(id: string, db: DbClient = this.prisma) {
    return db.fileObject.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });
  }
}