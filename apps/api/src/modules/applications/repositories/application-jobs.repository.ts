import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface PublishedApplicationJob {
  id: string;
  currentPublishedVersionId: string;
}

@Injectable()
export class ApplicationJobsRepository {
  constructor(private readonly prisma: PrismaService) { }

  async lockPublishedById(jobId: string, db: Prisma.TransactionClient): Promise<PublishedApplicationJob | null> {
    const rows = await db.$queryRaw<PublishedApplicationJob[]>(
      Prisma.sql`
        SELECT j.id, j.current_published_version_id AS "currentPublishedVersionId"
        FROM jobs j
        JOIN companies c ON c.id = j.company_id
        JOIN job_versions jv ON jv.id = j.current_published_version_id
        WHERE j.id = CAST(${jobId} AS uuid)
          AND j.status = 'PUBLISHED'
          AND j.deleted_at IS NULL
          AND j.current_published_version_id IS NOT NULL
          AND c.status = 'ACTIVE'
          AND c.deleted_at IS NULL
          AND jv.job_id = j.id
          AND jv.version_status = 'PUBLISHED'
          AND jv.published_at IS NOT NULL
        FOR SHARE OF j, c, jv
      `,
    );

    return rows[0] ?? null;
  }
}