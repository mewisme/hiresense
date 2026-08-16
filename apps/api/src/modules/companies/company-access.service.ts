import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { CompanyMembershipsRepository } from './repositories/company-memberships.repository';
import {
  isCompanyMembershipRole,
  type CompanyMembershipRole,
} from './types/company-membership.type';

@Injectable()
export class CompanyAccessService {
  constructor(
    private readonly membershipsRepository:
      CompanyMembershipsRepository,
  ) { }

  async requireActiveMembership(
    userId: string,
    companyId: string,
    allowedRoles?: readonly CompanyMembershipRole[],
  ) {
    const membership =
      await this.membershipsRepository
        .findActiveWithCompany(
          companyId,
          userId,
        );

    if (!membership) {
      throw new ForbiddenException(
        'Active company membership required',
      );
    }

    if (
      !isCompanyMembershipRole(
        membership.role,
      )
    ) {
      throw new InternalServerErrorException(
        'Unknown company membership role',
      );
    }

    if (
      allowedRoles &&
      !allowedRoles.includes(
        membership.role,
      )
    ) {
      throw new ForbiddenException(
        'Insufficient company permission',
      );
    }

    return {
      ...membership,

      role:
        membership.role as CompanyMembershipRole,
    };
  }
}