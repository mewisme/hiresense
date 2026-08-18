import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiClientError } from './ai-client.error';
import type { ExtractResumeTextInput, ExtractResumeTextResponse } from './dto/extract-resume-text.dto';
import type { ExtractResumeSkillsInput, ExtractResumeSkillsResponse } from './dto/extract-resume-skills.dto';
import type { ExtractResumeExperiencesInput, ExtractResumeExperiencesResponse } from './dto/extract-resume-experiences.dto';

@Injectable()
export class AiClientService {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(configService: ConfigService) {
    this.baseUrl = configService.getOrThrow<string>('ai.baseUrl').replace(/\/+$/, '');
    this.timeoutMs = configService.getOrThrow<number>('ai.timeoutMs');
  }

  async extractResumeText(input: ExtractResumeTextInput): Promise<ExtractResumeTextResponse> {
    const form = new FormData();
    form.append('file', new Blob([Uint8Array.from(input.file)], { type: input.contentType }), input.filename);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/v1/resume/extract-text`, {
        method: 'POST',
        body: form,
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = this.readErrorDetail(payload);
        throw new AiClientError(detail.code, detail.message, response.status);
      }

      if (!this.isExtractResumeTextResponse(payload)) {
        throw new AiClientError('AI_INVALID_RESPONSE', 'AI service returned an invalid resume text extraction response', response.status);
      }

      return payload;
    } catch (error) {
      if (error instanceof AiClientError) throw error;
      if (error instanceof Error && error.name === 'AbortError') throw new AiClientError('AI_TIMEOUT', `AI service request timed out after ${this.timeoutMs}ms`);
      throw new AiClientError('AI_UNAVAILABLE', error instanceof Error ? error.message : 'AI service is unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  async extractResumeSkills(input: ExtractResumeSkillsInput): Promise<ExtractResumeSkillsResponse> {
    const payload = await this.postJson('/v1/resume/extract-skills', input);

    if (!this.isExtractResumeSkillsResponse(payload)) {
      throw new AiClientError('AI_INVALID_RESPONSE', 'AI service returned an invalid resume skill extraction response');
    }

    return payload;
  }

  async extractResumeExperiences(input: ExtractResumeExperiencesInput): Promise<ExtractResumeExperiencesResponse> {
    const payload = await this.postJson('/v1/resume/extract-experiences', input);

    if (!this.isExtractResumeExperiencesResponse(payload)) {
      throw new AiClientError('AI_INVALID_RESPONSE', 'AI service returned an invalid resume experience extraction response');
    }

    return payload;
  }

  private isExtractResumeExperiencesResponse(value: unknown): value is ExtractResumeExperiencesResponse {
    if (!value || typeof value !== 'object') return false;
    const result = value as Record<string, unknown>;

    if (!Array.isArray(result.experiences) || !Array.isArray(result.warnings)) return false;
    if (!result.warnings.every((warning) => typeof warning === 'string')) return false;

    return result.experiences.every((item) => {
      if (!item || typeof item !== 'object') return false;
      const experience = item as Record<string, unknown>;

      return (typeof experience.companyName === 'string' || experience.companyName === null)
        && (typeof experience.jobTitle === 'string' || experience.jobTitle === null)
        && this.isIsoDate(experience.startDate)
        && (experience.endDate === null || this.isIsoDate(experience.endDate))
        && typeof experience.isCurrent === 'boolean'
        && (typeof experience.description === 'string' || experience.description === null)
        && typeof experience.experienceMonths === 'number'
        && Number.isInteger(experience.experienceMonths)
        && experience.experienceMonths >= 0
        && typeof experience.ordinal === 'number'
        && Number.isInteger(experience.ordinal)
        && experience.ordinal >= 0
        && typeof experience.confidence === 'number'
        && Number.isFinite(experience.confidence)
        && experience.confidence >= 0
        && experience.confidence <= 1;
    });
  }

  private isIsoDate(value: unknown): value is string {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  private isExtractResumeTextResponse(value: unknown): value is ExtractResumeTextResponse {
    if (!value || typeof value !== 'object') return false;
    const result = value as Record<string, unknown>;
    return typeof result.text === 'string'
      && typeof result.pageCount === 'number'
      && Number.isInteger(result.pageCount)
      && typeof result.textLength === 'number'
      && Number.isInteger(result.textLength)
      && Array.isArray(result.warnings)
      && result.warnings.every((warning) => typeof warning === 'string');
  }

  private readErrorDetail(payload: unknown): { code: string; message: string } {
    if (!payload || typeof payload !== 'object') return { code: 'AI_SERVICE_ERROR', message: 'AI service request failed' };
    const detail = (payload as Record<string, unknown>).detail;
    if (!detail || typeof detail !== 'object') return { code: 'AI_SERVICE_ERROR', message: 'AI service request failed' };
    const record = detail as Record<string, unknown>;
    return {
      code: typeof record.code === 'string' ? record.code : 'AI_SERVICE_ERROR',
      message: typeof record.message === 'string' ? record.message : 'AI service request failed',
    };
  }

  private async postJson(path: string, body: unknown): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = this.readErrorDetail(payload);
        throw new AiClientError(detail.code, detail.message, response.status);
      }

      return payload;
    } catch (error) {
      if (error instanceof AiClientError) throw error;
      if (error instanceof Error && error.name === 'AbortError') throw new AiClientError('AI_TIMEOUT', `AI service request timed out after ${this.timeoutMs}ms`);
      throw new AiClientError('AI_UNAVAILABLE', error instanceof Error ? error.message : 'AI service is unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  private isExtractResumeSkillsResponse(value: unknown): value is ExtractResumeSkillsResponse {
    if (!value || typeof value !== 'object') return false;

    const result = value as Record<string, unknown>;
    if (!Array.isArray(result.skills)) return false;

    return result.skills.every((item) => {
      if (!item || typeof item !== 'object') return false;
      const skill = item as Record<string, unknown>;

      return typeof skill.skillId === 'string'
        && typeof skill.matchedText === 'string'
        && typeof skill.evidenceText === 'string'
        && typeof skill.confidence === 'number'
        && Number.isFinite(skill.confidence)
        && skill.confidence >= 0
        && skill.confidence <= 1;
    });
  }
}