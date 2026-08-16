import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DisCloudStorageProvider } from './providers/discloud/discloud-storage.provider';
import type { StorageProvider } from './storage-provider.interface';
import type { StoredObject, StoredObjectStream, StorageObjectReference, StoragePutInput } from './storage.types';

@Injectable()
export class StorageService {
  private readonly providers: Map<string, StorageProvider>;
  readonly defaultProviderCode: string;

  constructor(configService: ConfigService, discloudProvider: DisCloudStorageProvider) {
    this.providers = new Map([[discloudProvider.code, discloudProvider]]);
    this.defaultProviderCode = configService.getOrThrow<string>('storage.provider').trim().toUpperCase();
    this.getProvider(this.defaultProviderCode);
  }

  put(input: StoragePutInput): Promise<StoredObject> {
    return this.getProvider(this.defaultProviderCode).put(input);
  }

  get(reference: StorageObjectReference): Promise<StoredObjectStream> {
    return this.getProvider(reference.provider).get(reference);
  }

  delete(reference: StorageObjectReference): Promise<void> {
    return this.getProvider(reference.provider).delete(reference);
  }

  exists(reference: StorageObjectReference): Promise<boolean> {
    return this.getProvider(reference.provider).exists(reference);
  }

  private getProvider(code: string): StorageProvider {
    const provider = this.providers.get(code.trim().toUpperCase());
    if (!provider) throw new Error(`Storage provider is not configured: ${code}`);
    return provider;
  }
}