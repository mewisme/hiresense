import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class ApplicationCandidatesRepository {
  constructor(private readonly prisma: PrismaService) { }

  findProfileByUserId(userId: string, db: DbClient = this.prisma) {
    return db.candidateProfile.findUnique({ where: { userId } });
  }

  async lockOwnedResumeVersion(candidateProfileId: string, resumeVersionId: string, db: Prisma.TransactionClient): Promise<boolean> {
    const rows = await db.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT rv.id
        FROM resume_versions rv
        JOIN resumes r ON r.id = rv.resume_id
        JOIN file_objects fo ON fo.id = rv.file_object_id
        WHERE rv.id = CAST(${resumeVersionId} AS uuid)
          AND r.candidate_profile_id = CAST(${candidateProfileId} AS uuid)
          AND r.deleted_at IS NULL
          AND fo.status = 'ACTIVE'
          AND fo.deleted_at IS NULL
        FOR SHARE OF rv, r, fo
      `,
    );

    return rows.length > 0;
  }
}