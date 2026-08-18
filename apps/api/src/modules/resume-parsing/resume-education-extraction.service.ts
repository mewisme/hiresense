import { Injectable } from '@nestjs/common';
import { AiClientService } from '../../infrastructure/ai/ai-client.service';

@Injectable()
export class ResumeEducationExtractionService {
  constructor(private readonly aiClientService: AiClientService) { }

  extract(rawText: string) {
    return this.aiClientService.extractResumeEducations({ text: rawText });
  }
}