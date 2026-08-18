import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

export interface LockedResumeParsingSource {
  id: string;
  resumeId: string;
  versionNo: number;
  fileObjectId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: bigint;
}

@Injectable()
export class ResumeParsingSourceRepository {
  constructor(private readonly prisma: PrismaService) { }

  findCandidateOwnedResumeVersion(resumeId: string, resumeVersionId: string, candidateProfileId: string, db: DbClient = this.prisma) {
    return db.resumeVersion.findFirst({
      where: {
        id: resumeVersionId,
        resume: {
          id: resumeId,
          candidateProfileId,
          deletedAt: null,
        },
      },
      select: { id: true, resumeId: true, versionNo: true, fileObjectId: true, createdAt: true },
    });
  }

  async lockCandidateOwnedAvailableResumeVersion(
    resumeId: string,
    resumeVersionId: string,
    candidateProfileId: string,
    db: Prisma.TransactionClient,
  ): Promise<LockedResumeParsingSource | null> {
    const rows = await db.$queryRaw<LockedResumeParsingSource[]>(
      Prisma.sql`
        SELECT
          rv.id,
          rv.resume_id AS "resumeId",
          rv.version_no AS "versionNo",
          rv.file_object_id AS "fileObjectId",
          fo.original_filename AS "originalFilename",
          fo.mime_type AS "mimeType",
          fo.size_bytes AS "sizeBytes"
        FROM resume_versions rv
        JOIN resumes r ON r.id = rv.resume_id
        JOIN file_objects fo ON fo.id = rv.file_object_id
        WHERE rv.id = CAST(${resumeVersionId} AS uuid)
          AND rv.resume_id = CAST(${resumeId} AS uuid)
          AND r.candidate_profile_id = CAST(${candidateProfileId} AS uuid)
          AND r.deleted_at IS NULL
          AND fo.status = 'ACTIVE'
          AND fo.deleted_at IS NULL
        FOR UPDATE OF rv
      `,
    );
    return rows[0] ?? null;
  }
}