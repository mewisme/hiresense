export const COMPANY_MEMBERSHIP_ROLES = [
  'OWNER',
  'ADMIN',
  'RECRUITER',
  'REVIEWER',
] as const;

export type CompanyMembershipRole =
  (typeof COMPANY_MEMBERSHIP_ROLES)[number];

export function isCompanyMembershipRole(
  value: string,
): value is CompanyMembershipRole {
  return COMPANY_MEMBERSHIP_ROLES.some(
    (role) => role === value,
  );
}

export const COMPANY_MEMBERSHIP_STATUSES = [
  'ACTIVE',
  'INVITED',
  'SUSPENDED',
  'LEFT',
] as const;

export type CompanyMembershipStatus =
  (typeof COMPANY_MEMBERSHIP_STATUSES)[number];

export function isCompanyMembershipStatus(
  value: string,
): value is CompanyMembershipStatus {
  return COMPANY_MEMBERSHIP_STATUSES.some(
    (status) => status === value,
  );
}