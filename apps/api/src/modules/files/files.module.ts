import { Module } from '@nestjs/common';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { FileStorageService } from './file-storage.service';
import { FileObjectsRepository } from './repositories/file-objects.repository';

@Module({
  imports: [StorageModule],
  providers: [FileObjectsRepository, FileStorageService],
  exports: [FileObjectsRepository, FileStorageService],
})
export class FilesModule { }