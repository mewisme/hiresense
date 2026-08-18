import type { Readable } from 'node:stream';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AiClientError } from '../../infrastructure/ai/ai-client.error';
import { AiClientService } from '../../infrastructure/ai/ai-client.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { FileStorageService } from '../files/file-storage.service';
import { RESUME_MAX_FILE_SIZE_BYTES } from '../resumes/utils/resume-file.util';
import { RESUME_PARSER_PIPELINE_CODE, RESUME_PARSER_PIPELINE_TYPE } from './constants/resume-parsing.constants';
import { AiPipelineVersionsRepository } from './repositories/ai-pipeline-versions.repository';
import { ResumeEducationsRepository } from './repositories/resume-educations.repository';
import { ResumeExperiencesRepository } from './repositories/resume-experiences.repository';
import { ResumeParseRunsRepository } from './repositories/resume-parse-runs.repository';
import { ResumeParsingSourceRepository, type LockedResumeParsingSource } from './repositories/resume-parsing-source.repository';
import { ResumeSkillsRepository } from './repositories/resume-skills.repository';
import { ResumeEducationExtractionService } from './resume-education-extraction.service';
import { ResumeExperienceExtractionService } from './resume-experience-extraction.service';
import { ResumeSkillExtractionService } from './resume-skill-extraction.service';

@Injectable()
export class ResumeParsingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiClientService: AiClientService,
    private readonly fileStorageService: FileStorageService,
    private readonly aiPipelineVersionsRepository: AiPipelineVersionsRepository,
    private readonly resumeParsingSourceRepository: ResumeParsingSourceRepository,
    private readonly resumeParseRunsRepository: ResumeParseRunsRepository,
    private readonly resumeSkillExtractionService: ResumeSkillExtractionService,
    private readonly resumeExperienceExtractionService: ResumeExperienceExtractionService,
    private readonly resumeEducationExtractionService: ResumeEducationExtractionService,
    private readonly resumeSkillsRepository: ResumeSkillsRepository,
    private readonly resumeExperiencesRepository: ResumeExperiencesRepository,
    private readonly resumeEducationsRepository: ResumeEducationsRepository,
  ) { }

  async parseForCandidate(resumeId: string, resumeVersionId: string, candidateProfileId: string) {
    const prepared = await this.prepareCandidateRun(resumeId, resumeVersionId, candidateProfileId);

    if (!prepared.shouldProcess) {
      const hydrated = await this.resumeParseRunsRepository.findByIdWithResult(prepared.parseRun.id);
      if (!hydrated) throw new InternalServerErrorException('Resume parse run disappeared');
      return { parseRun: hydrated, reused: true };
    }

    await this.processRun(
      prepared.parseRun.id,
      prepared.source,
      prepared.pipeline.config,
    );

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

      const pipeline = await this.aiPipelineVersionsRepository.findActiveByCodeAndType(
        RESUME_PARSER_PIPELINE_CODE,
        RESUME_PARSER_PIPELINE_TYPE,
        tx,
      );

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

  private async processRun(parseRunId: string, source: LockedResumeParsingSource, pipelineConfig: unknown): Promise<void> {
    const startedAt = new Date();

    try {
      const processing = await this.resumeParseRunsRepository.markProcessing(parseRunId, startedAt);
      if (!processing) return;

      const stored = await this.fileStorageService.open(source.fileObjectId);
      const buffer = await this.readPdfStream(stored.stream);

      const textExtraction = await this.aiClientService.extractResumeText({
        file: buffer,
        filename: source.originalFilename,
        contentType: source.mimeType,
      });

      const [skills, experienceExtraction, educationExtraction] = await Promise.all([
        this.resumeSkillExtractionService.extract(textExtraction.text, pipelineConfig),
        this.resumeExperienceExtractionService.extract(textExtraction.text, startedAt),
        this.resumeEducationExtractionService.extract(textExtraction.text),
      ]);

      const warnings = [...new Set([
        ...textExtraction.warnings,
        ...experienceExtraction.warnings,
        ...educationExtraction.warnings,
      ])];

      await this.prisma.$transaction(async (tx) => {
        await this.resumeSkillsRepository.createMany(
          parseRunId,
          skills.map((skill) => ({
            skillId: skill.skillId,
            confidence: skill.confidence,
            evidenceText: skill.evidenceText,
          })),
          tx,
        );

        await this.resumeExperiencesRepository.createMany(
          parseRunId,
          experienceExtraction.experiences.map((experience) => ({
            companyName: experience.companyName,
            jobTitle: experience.jobTitle,
            startDate: this.toDateOnly(experience.startDate),
            endDate: this.toDateOnly(experience.endDate),
            isCurrent: experience.isCurrent,
            description: experience.description,
            experienceMonths: experience.experienceMonths,
            ordinal: experience.ordinal,
            confidence: experience.confidence,
          })),
          tx,
        );

        await this.resumeEducationsRepository.createMany(
          parseRunId,
          educationExtraction.educations.map((education) => ({
            institutionName: education.institutionName,
            degree: education.degree,
            fieldOfStudy: education.fieldOfStudy,
            startDate: this.toDateOnly(education.startDate),
            endDate: this.toDateOnly(education.endDate),
            description: education.description,
            ordinal: education.ordinal,
            confidence: education.confidence,
          })),
          tx,
        );

        const succeeded = await this.resumeParseRunsRepository.markSucceeded(parseRunId, {
          rawText: textExtraction.text,
          rawOutput: {
            extraction: {
              pageCount: textExtraction.pageCount,
              textLength: textExtraction.textLength,
            },
            parsing: {
              referenceDate: startedAt.toISOString().slice(0, 10),
              skillCount: skills.length,
              experienceCount: experienceExtraction.experiences.length,
              educationCount: educationExtraction.educations.length,
            },
          },
          warnings,
        }, tx);

        if (!succeeded) throw new Error('Resume parse run could not enter SUCCEEDED status');
      });
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

  private toDateOnly(value: string | null): Date | null {
    return value ? new Date(`${value}T00:00:00.000Z`) : null;
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

    if (message === 'Resume PDF is empty') return { code: 'SOURCE_FILE_EMPTY', message };
    if (message === 'Resume PDF exceeds maximum supported parsing size') return { code: 'SOURCE_FILE_TOO_LARGE', message };

    return {
      code: 'RESUME_PARSING_FAILED',
      message: message.slice(0, 2000),
    };
  }
}