import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiClientError } from './ai-client.error';
import type { ExtractResumeTextInput, ExtractResumeTextResponse } from './dto/extract-resume-text.dto';

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
}