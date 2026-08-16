import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient =
  | PrismaService
  | Prisma.TransactionClient;

export interface CreateAuthSessionInput {
  userId: string;
  expiresAt: Date;

  deviceName?: string;
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthSessionsRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  create(
    input: CreateAuthSessionInput,
    db: DbClient = this.prisma,
  ) {
    return db.authSession.create({
      data: {
        userId: input.userId,

        // Temporary value.
        // It will be replaced by the real refresh-token hash
        // before the transaction commits.
        refreshTokenHash:
          randomBytes(32).toString('hex'),

        expiresAt: input.expiresAt,

        deviceName: input.deviceName,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
      },
    });
  }

  updateRefreshTokenHash(
    sessionId: string,
    refreshTokenHash: string,
    db: DbClient = this.prisma,
  ) {
    return db.authSession.update({
      where: {
        id: sessionId,
      },
      data: {
        refreshTokenHash,
      },
    });
  }

  findByIdWithUser(
    sessionId: string,
  ) {
    return this.prisma.authSession.findUnique({
      where: {
        id: sessionId,
      },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async rotateRefreshToken(
    input: {
      sessionId: string;
      expectedCurrentHash: string;
      nextHash: string;
      usedAt: Date;
    },
  ): Promise<boolean> {
    const result =
      await this.prisma.authSession.updateMany({
        where: {
          id: input.sessionId,

          refreshTokenHash:
            input.expectedCurrentHash,

          revokedAt: null,

          expiresAt: {
            gt: input.usedAt,
          },
        },

        data: {
          refreshTokenHash:
            input.nextHash,

          lastUsedAt:
            input.usedAt,
        },
      });

    return result.count === 1;
  }

  async revoke(
    sessionId: string,
    userId: string,
  ): Promise<boolean> {
    const result =
      await this.prisma.authSession.updateMany({
        where: {
          id: sessionId,
          userId,
          revokedAt: null,
        },

        data: {
          revokedAt: new Date(),
        },
      });

    return result.count === 1;
  }
}