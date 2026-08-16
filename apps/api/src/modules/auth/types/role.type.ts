export const APP_ROLES = [
  'CANDIDATE',
  'RECRUITER',
  'ADMIN',
] as const;

export type AppRole =
  (typeof APP_ROLES)[number];

export function isAppRole(
  value: string,
): value is AppRole {
  return APP_ROLES.some(
    (role) => role === value,
  );
}