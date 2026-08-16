import { Module } from '@nestjs/common';
import { DiscordClient } from './providers/discloud/discord/discord.client';
import { DisCloudStorageProvider } from './providers/discloud/discloud-storage.provider';
import { DiscordChunksRepository } from './providers/discloud/repositories/discord-chunks.repository';
import { DiscordFilePartsRepository } from './providers/discloud/repositories/discord-file-parts.repository';
import { StorageService } from './storage.service';

@Module({
  providers: [
    DiscordClient,
    DiscordChunksRepository,
    DiscordFilePartsRepository,
    DisCloudStorageProvider,
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule { }