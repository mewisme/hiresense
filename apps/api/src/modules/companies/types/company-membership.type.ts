export const COMPANY_MEMBERSHIP_ROLES = [
  'OWNER',
  'ADMIN',
  'RECRUITER',
  'REVIEWER',
] as const;

export type CompanyMembershipRole =
  (typeof COMPANY_MEMBERSHIP_ROLES)[number];

export const COMPANY_MEMBERSHIP_STATUSES = [
  'ACTIVE',
  'INVITED',
  'SUSPENDED',
  'LEFT',
] as const;

export type CompanyMembershipStatus =
  (typeof COMPANY_MEMBERSHIP_STATUSES)[number];