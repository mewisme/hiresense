import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { Prisma } from '../../../generated/prisma/client';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) { }

  findByEmail(email: string, db: DbClient = this.prisma) {
    return db.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          }
        }
      }
    })
  }

  findById(id: string, db: DbClient = this.prisma) {
    return db.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          }
        }
      }
    })
  }

  findRoleByCode(code: string, db: DbClient = this.prisma) {
    return db.role.findUnique({
      where: { code },
    })
  }

  create(
    data: {
      email: string;
      passwordHash: string;
    },
    db: DbClient = this.prisma
  ) {
    return db.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        status: 'ACTIVE',
      }
    })
  }

  assignRole(
    data: {
      userId: string;
      roleId: string;
    },
    db: DbClient = this.prisma
  ) {
    return db.userRole.create({
      data: {
        userId: data.userId,
        roleId: data.roleId,
      }
    })
  }
}
