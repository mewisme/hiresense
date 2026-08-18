import type { Readable } from 'node:stream';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AiClientError } from '../../infrastructure/ai/ai-client.error';
import { AiClientService } from '../../infrastructure/ai/ai-client.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { FileStorageService } from '../files/file-storage.service';
import { RESUME_MAX_FILE_SIZE_BYTES } from '../resumes/utils/resume-file.util';
import { RESUME_PARSER_PIPELINE_CODE, RESUME_PARSER_PIPELINE_TYPE } from './constants/resume-parsing.constants';
import { AiPipelineVersionsRepository } from './repositories/ai-pipeline-versions.repository';
import { ResumeParseRunsRepository } from './repositories/resume-parse-runs.repository';
import { ResumeParsingSourceRepository, type LockedResumeParsingSource } from './repositories/resume-parsing-source.repository';

@Injectable()
export class ResumeParsingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiClientService: AiClientService,
    private readonly fileStorageService: FileStorageService,
    private readonly aiPipelineVersionsRepository: AiPipelineVersionsRepository,
    private readonly resumeParsingSourceRepository: ResumeParsingSourceRepository,
    private readonly resumeParseRunsRepository: ResumeParseRunsRepository,
  ) { }

  async parseForCandidate(resumeId: string, resumeVersionId: string, candidateProfileId: string) {
    const prepared = await this.prepareCandidateRun(resumeId, resumeVersionId, candidateProfileId);
    if (!prepared.shouldProcess) return { parseRun: prepared.parseRun, reused: true };

    await this.processRun(prepared.parseRun.id, prepared.source);

    const completed = await this.resumeParseRunsRepository.findByIdWithResult(prepared.parseRun.id);
    if (!completed) throw new InternalServerErrorException('Resume parse run disappeared after processing');

    return { parseRun: completed, reused: false };
  }

  async getLatestForCandidate(resumeId: string, resumeVersionId: string, candidateProfileId: string) {
    const source = await this.resumeParsingSourceRepository.findCandidateOwnedResumeVersion(resumeId, resumeVersionId, candidateProfileId);
    if (!source) throw new NotFoundException('Resume version not found');

    return this.resumeParseRunsRepository.findLatestByResumeVersionId(source.id);
  }

  async getParseRun(parseRunId: string) {
    const parseRun = await this.resumeParseRunsRepository.findByIdWithResult(parseRunId);
    if (!parseRun) throw new NotFoundException('Resume parse run not found');
    return parseRun;
  }

  getLatestSucceeded(resumeVersionId: string) {
    return this.resumeParseRunsRepository.findLatestSucceededByResumeVersionId(resumeVersionId);
  }

  private prepareCandidateRun(resumeId: string, resumeVersionId: string, candidateProfileId: string) {
    return this.prisma.$transaction(async (tx) => {
      const source = await this.resumeParsingSourceRepository.lockCandidateOwnedAvailableResumeVersion(resumeId, resumeVersionId, candidateProfileId, tx);
      if (!source) throw new NotFoundException('Resume version is not available for parsing');

      const pipeline = await this.aiPipelineVersionsRepository.findActiveByCodeAndType(RESUME_PARSER_PIPELINE_CODE, RESUME_PARSER_PIPELINE_TYPE, tx);
      if (!pipeline) throw new InternalServerErrorException('Active resume parser pipeline is not configured');

      const latest = await this.resumeParseRunsRepository.findLatestByResumeVersionAndPipeline(source.id, pipeline.id, tx);

      if (latest && ['PENDING', 'PROCESSING', 'SUCCEEDED'].includes(latest.status)) {
        return { parseRun: latest, source, pipeline, shouldProcess: false as const };
      }

      const parseRun = await this.resumeParseRunsRepository.create({
        resumeVersionId: source.id,
        pipelineVersionId: pipeline.id,
      }, tx);

      const hydrated = await this.resumeParseRunsRepository.findLatestByResumeVersionAndPipeline(source.id, pipeline.id, tx);
      if (!hydrated || hydrated.id !== parseRun.id) throw new InternalServerErrorException('Failed to initialize resume parse run');

      return { parseRun: hydrated, source, pipeline, shouldProcess: true as const };
    });
  }

  private async processRun(parseRunId: string, source: LockedResumeParsingSource): Promise<void> {
    try {
      const processing = await this.resumeParseRunsRepository.markProcessing(parseRunId);
      if (!processing) return;

      const stored = await this.fileStorageService.open(source.fileObjectId);
      const buffer = await this.readPdfStream(stored.stream);

      const extraction = await this.aiClientService.extractResumeText({
        file: buffer,
        filename: source.originalFilename,
        contentType: source.mimeType,
      });

      const succeeded = await this.resumeParseRunsRepository.markSucceeded(parseRunId, {
        rawText: extraction.text,
        rawOutput: {
          pageCount: extraction.pageCount,
          textLength: extraction.textLength,
        },
        warnings: extraction.warnings,
      });

      if (!succeeded) throw new Error('Resume parse run could not enter SUCCEEDED status');
    } catch (error) {
      const failure = this.resolveFailure(error);

      await this.resumeParseRunsRepository.markFailed(parseRunId, {
        errorCode: failure.code,
        errorMessage: failure.message,
      });

      throw error;
    }
  }

  private async readPdfStream(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    for await (const chunk of stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buffer.length;

      if (totalBytes > RESUME_MAX_FILE_SIZE_BYTES) {
        throw new Error('Resume PDF exceeds maximum supported parsing size');
      }

      chunks.push(buffer);
    }

    if (totalBytes === 0) throw new Error('Resume PDF is empty');
    return Buffer.concat(chunks, totalBytes);
  }

  private resolveFailure(error: unknown): { code: string; message: string } {
    if (error instanceof AiClientError) {
      return {
        code: error.code.slice(0, 100),
        message: error.message.slice(0, 2000),
      };
    }

    if (error instanceof NotFoundException) {
      return {
        code: 'SOURCE_FILE_UNAVAILABLE',
        message: error.message.slice(0, 2000),
      };
    }

    const message = error instanceof Error ? error.message : 'Unknown resume parsing error';

    if (message === 'Resume PDF is empty') {
      return { code: 'SOURCE_FILE_EMPTY', message };
    }

    if (message === 'Resume PDF exceeds maximum supported parsing size') {
      return { code: 'SOURCE_FILE_TOO_LARGE', message };
    }

    return {
      code: 'TEXT_EXTRACTION_FAILED',
      message: message.slice(0, 2000),
    };
  }
}