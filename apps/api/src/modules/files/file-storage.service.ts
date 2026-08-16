import type { Readable } from 'node:stream';
import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { FileObjectsRepository } from './repositories/file-objects.repository';

export interface StoreFileInput {
  bucket: string;
  objectKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: bigint;
  uploadedByUserId: string;
  content: Readable;
}

@Injectable()
export class FileStorageService {
  constructor(
    private readonly storageService: StorageService,
    private readonly fileObjectsRepository: FileObjectsRepository,
  ) { }

  async store(input: StoreFileInput) {
    const storageProvider = this.storageService.defaultProviderCode;
    const fileObject = await this.fileObjectsRepository.createUploading({
      storageProvider,
      bucket: input.bucket,
      objectKey: input.objectKey,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      uploadedByUserId: input.uploadedByUserId,
    });

    try {
      const stored = await this.storageService.put({
        fileObjectId: fileObject.id,
        bucket: input.bucket,
        objectKey: input.objectKey,
        content: input.content,
        contentType: input.mimeType,
        sizeBytes: input.sizeBytes,
      });

      if (stored.provider !== storageProvider) throw new Error(`Storage provider mismatch: expected ${storageProvider}, received ${stored.provider}`);
      if (stored.bucket !== input.bucket) throw new Error(`Storage bucket mismatch: expected ${input.bucket}, received ${stored.bucket}`);
      if (stored.objectKey !== input.objectKey) throw new Error('Storage object key mismatch');
      if (stored.sizeBytes !== input.sizeBytes) throw new Error(`Storage size mismatch: expected ${input.sizeBytes.toString()}, received ${stored.sizeBytes.toString()}`);

      return await this.fileObjectsRepository.markActive(fileObject.id, {
        sha256: stored.sha256,
        sizeBytes: stored.sizeBytes,
      });
    } catch (error) {
      await this.compensateFailedStore(fileObject.id, storageProvider, input);
      throw error;
    }
  }

  async open(fileObjectId: string) {
    const fileObject = await this.fileObjectsRepository.findActiveById(fileObjectId);
    if (!fileObject) throw new NotFoundException('File object not found');

    const storedObject = await this.storageService.get({
      fileObjectId: fileObject.id,
      provider: fileObject.storageProvider,
      bucket: fileObject.bucket,
      objectKey: fileObject.objectKey,
      contentType: fileObject.mimeType,
    });

    return { fileObject, ...storedObject };
  }

  async delete(fileObjectId: string): Promise<void> {
    const fileObject = await this.fileObjectsRepository.findById(fileObjectId);
    if (!fileObject || fileObject.status === 'DELETED') return;

    await this.storageService.delete({
      fileObjectId: fileObject.id,
      provider: fileObject.storageProvider,
      bucket: fileObject.bucket,
      objectKey: fileObject.objectKey,
      contentType: fileObject.mimeType,
    });

    await this.fileObjectsRepository.markDeleted(fileObject.id);
  }

  private async compensateFailedStore(fileObjectId: string, provider: string, input: StoreFileInput): Promise<void> {
    try {
      await this.storageService.delete({
        fileObjectId,
        provider,
        bucket: input.bucket,
        objectKey: input.objectKey,
        contentType: input.mimeType,
      });
    } catch {
      // Best-effort physical cleanup.
    }

    try {
      await this.fileObjectsRepository.markFailed(fileObjectId);
    } catch {
      // Preserve original storage error.
    }
  }
}