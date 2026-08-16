import {
  isAppRole,
  type AppRole,
} from '../types/role.type';

export function parseAppRoles(
  roleCodes: string[],
): AppRole[] {
  const roles: AppRole[] = [];

  for (const roleCode of roleCodes) {
    if (!isAppRole(roleCode)) {
      throw new Error(
        `Unknown application role: ${roleCode}`,
      );
    }

    roles.push(roleCode);
  }

  return roles;
}