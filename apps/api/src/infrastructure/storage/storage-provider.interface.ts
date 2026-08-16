import type {
  StoredObject,
  StoredObjectStream,
  StorageObjectReference,
  StoragePutInput,
} from './storage.types';

export interface StorageProvider {
  readonly code: string;

  put(
    input: StoragePutInput,
  ): Promise<StoredObject>;

  get(
    reference: StorageObjectReference,
  ): Promise<StoredObjectStream>;

  delete(
    reference: StorageObjectReference,
  ): Promise<void>;

  exists(
    reference: StorageObjectReference,
  ): Promise<boolean>;
}