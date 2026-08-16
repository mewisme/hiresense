import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class CandidatesRepository {
  constructor(private readonly prisma: PrismaService) { }

  findByUserId(userId: string) {
    return this.prisma.candidateProfile.findUnique({ where: { userId } });
  }
}
