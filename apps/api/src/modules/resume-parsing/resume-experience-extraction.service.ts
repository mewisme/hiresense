import { Injectable } from '@nestjs/common';
import { AiClientService } from '../../infrastructure/ai/ai-client.service';

@Injectable()
export class ResumeExperienceExtractionService {
  constructor(private readonly aiClientService: AiClientService) { }

  extract(rawText: string, referenceDate: Date = new Date()) {
    return this.aiClientService.extractResumeExperiences({
      text: rawText,
      referenceDate: referenceDate.toISOString().slice(0, 10),
    });
  }
}