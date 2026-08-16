import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import { Prisma as PrismaNamespace } from '../../generated/prisma/client';

import { UsersRepository } from './repositories/users.repository';

export type UserWithRoles = NonNullable<
  Awaited<ReturnType<UsersRepository['findById']>>
>;

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
  ) { }

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<UserWithRoles> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createIdentity(
    input: {
      email: string;
      passwordHash: string;
      roleCode: 'CANDIDATE' | 'RECRUITER';
    },
    tx: Prisma.TransactionClient,
  ): Promise<UserWithRoles> {
    const role = await this.usersRepository.findRoleByCode(
      input.roleCode,
      tx,
    );

    if (!role) {
      throw new InternalServerErrorException(
        `Role ${input.roleCode} has not been seeded`,
      );
    }

    try {
      const user = await this.usersRepository.create(
        {
          email: input.email,
          passwordHash: input.passwordHash,
        },
        tx,
      );

      await this.usersRepository.assignRole(
        {
          userId: user.id,
          roleId: role.id,
        },
        tx,
      );

      const createdUser =
        await this.usersRepository.findById(
          user.id,
          tx,
        );

      if (!createdUser) {
        throw new InternalServerErrorException(
          'User was created but could not be loaded',
        );
      }

      return createdUser;
    } catch (error) {
      if (
        error instanceof
        PrismaNamespace.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Email is already registered',
        );
      }

      throw error;
    }
  }

  toPublicIdentity(user: UserWithRoles) {
    return {
      id: user.id,
      email: user.email,
      roles: user.userRoles.map(
        ({ role }) => role.code,
      ),
    };
  }
}