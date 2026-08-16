import type { Readable } from 'node:stream';

export interface StoragePutInput {
  fileObjectId: string;
  bucket: string;
  objectKey: string;
  content: Readable;
  contentType: string;
  sizeBytes: bigint;
}

export interface StoredObject {
  provider: string;
  bucket: string;
  objectKey: string;
  sizeBytes: bigint;
  contentType: string;
  sha256: string;
}

export interface StorageObjectReference {
  fileObjectId: string;
  provider: string;
  bucket: string;
  objectKey: string;
  contentType?: string;
}

export interface StoredObjectStream {
  stream: Readable;
  contentType: string;
  sizeBytes?: bigint;
  sha256?: string;
}