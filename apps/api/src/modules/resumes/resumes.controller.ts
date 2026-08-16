import { Readable } from 'node:stream';
import { Body, Controller, Delete, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Res, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express, Response } from 'express';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CandidatesService } from '../candidates/candidates.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { toResumeVersionResponse } from './mappers/resume-response.mapper';
import { ResumesService } from './resumes.service';
import { createAttachmentDisposition } from './utils/content-disposition.util';
import { createResumeObjectKey, RESUME_STORAGE_BUCKET } from './utils/resume-object-key.util';
import { RESUME_MAX_FILE_SIZE_BYTES, validateResumePdf } from './utils/resume-file.util';

@Controller('resumes')
@Auth('CANDIDATE')
export class ResumesController {
  constructor(
    private readonly candidatesService: CandidatesService,
    private readonly resumesService: ResumesService,
  ) { }

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { files: 1, fileSize: RESUME_MAX_FILE_SIZE_BYTES } }))
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateResumeDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    validateResumePdf(file);
    const candidate = await this.requireCandidate(user.id);

    const result = await this.resumesService.create({
      candidateProfileId: candidate.id,
      createdByUserId: user.id,
      name: dto.name,
      file: {
        bucket: RESUME_STORAGE_BUCKET,
        objectKey: createResumeObjectKey(user.id),
        originalFilename: file.originalname,
        mimeType: 'application/pdf',
        sizeBytes: BigInt(file.size),
        content: Readable.from([file.buffer]),
      },
    });

    return {
      id: result.resume.id,
      name: result.resume.name,
      isDefault: result.resume.isDefault,
      currentVersionId: result.resume.currentVersionId,
      version: {
        id: result.version.id,
        versionNo: result.version.versionNo,
        fileObjectId: result.version.fileObjectId,
        createdAt: result.version.createdAt,
      },
      file: {
        id: result.fileObject.id,
        originalFilename: result.fileObject.originalFilename,
        mimeType: result.fileObject.mimeType,
        sizeBytes: result.fileObject.sizeBytes.toString(),
        sha256: result.fileObject.sha256,
      },
      createdAt: result.resume.createdAt,
      updatedAt: result.resume.updatedAt,
    };
  }

  @Post(':resumeId/versions')
  @UseInterceptors(FileInterceptor('file', { limits: { files: 1, fileSize: RESUME_MAX_FILE_SIZE_BYTES } }))
  async addVersion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    validateResumePdf(file);
    const candidate = await this.requireCandidate(user.id);

    const result = await this.resumesService.addVersion({
      resumeId,
      candidateProfileId: candidate.id,
      createdByUserId: user.id,
      file: {
        bucket: RESUME_STORAGE_BUCKET,
        objectKey: createResumeObjectKey(user.id),
        originalFilename: file.originalname,
        mimeType: 'application/pdf',
        sizeBytes: BigInt(file.size),
        content: Readable.from([file.buffer]),
      },
    });

    return {
      id: result.resume.id,
      currentVersionId: result.resume.currentVersionId,
      version: {
        id: result.version.id,
        versionNo: result.version.versionNo,
        fileObjectId: result.version.fileObjectId,
        createdAt: result.version.createdAt,
      },
      file: {
        id: result.fileObject.id,
        originalFilename: result.fileObject.originalFilename,
        mimeType: result.fileObject.mimeType,
        sizeBytes: result.fileObject.sizeBytes.toString(),
        sha256: result.fileObject.sha256,
      },
    };
  }

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    const candidate = await this.requireCandidate(user.id);
    const items = await this.resumesService.list(candidate.id);

    return items.map(({ resume, currentVersion }) => ({
      id: resume.id,
      name: resume.name,
      isDefault: resume.isDefault,
      currentVersionId: resume.currentVersionId,
      currentVersion: currentVersion ? toResumeVersionResponse(currentVersion) : null,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    }));
  }

  @Get(':resumeId')
  async detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
  ) {
    const candidate = await this.requireCandidate(user.id);
    const result = await this.resumesService.getDetail(resumeId, candidate.id);

    return {
      id: result.resume.id,
      name: result.resume.name,
      isDefault: result.resume.isDefault,
      currentVersionId: result.resume.currentVersionId,
      versions: result.versions.map(toResumeVersionResponse),
      createdAt: result.resume.createdAt,
      updatedAt: result.resume.updatedAt,
    };
  }

  @Get(':resumeId/download')
  async downloadCurrent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const candidate = await this.requireCandidate(user.id);
    const result = await this.resumesService.openCurrentVersion(resumeId, candidate.id);

    response.setHeader('Content-Disposition', createAttachmentDisposition(result.fileObject.originalFilename));

    return new StreamableFile(result.stream, {
      type: result.contentType,
      length: result.sizeBytes ? Number(result.sizeBytes) : undefined,
    });
  }

  @Get(':resumeId/versions/:versionId/download')
  async downloadVersion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const candidate = await this.requireCandidate(user.id);
    const result = await this.resumesService.openVersion(resumeId, versionId, candidate.id);

    response.setHeader('Content-Disposition', createAttachmentDisposition(result.fileObject.originalFilename));

    return new StreamableFile(result.stream, {
      type: result.contentType,
      length: result.sizeBytes ? Number(result.sizeBytes) : undefined,
    });
  }

  @Patch(':resumeId/default')
  async setDefault(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
  ) {
    const candidate = await this.requireCandidate(user.id);
    const resume = await this.resumesService.setDefault(resumeId, candidate.id);

    return {
      id: resume.id,
      name: resume.name,
      isDefault: resume.isDefault,
      currentVersionId: resume.currentVersionId,
      updatedAt: resume.updatedAt,
    };
  }

  @Delete(':resumeId')
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
  ) {
    const candidate = await this.requireCandidate(user.id);
    const resume = await this.resumesService.delete(resumeId, candidate.id);
    return { id: resume.id, deleted: true };
  }

  private async requireCandidate(userId: string) {
    const candidate = await this.candidatesService.findByUserId(userId);
    if (!candidate) throw new NotFoundException('Candidate profile not found');
    return candidate;
  }
}