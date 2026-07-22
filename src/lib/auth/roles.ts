import type { RoleCode } from "@/lib/auth/types";

export const ALL_ROLES: RoleCode[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "PROJECT_MANAGER",
  "SUPERVISOR",
  "INSPECTOR",
  "CLIENT",
];

/** Roles that can view inspection / site-visit / issue workflows. */
export const INSPECTION_ROLES: RoleCode[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "PROJECT_MANAGER",
  "SUPERVISOR",
  "INSPECTOR",
];

/** Roles that can view reports. */
export const REPORT_ROLES: RoleCode[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "PROJECT_MANAGER",
  "SUPERVISOR",
  "CLIENT",
];

/** Roles that can manage platform settings. */
export const SETTINGS_ROLES: RoleCode[] = ["SUPER_ADMIN", "ADMIN"];

export function hasAnyRole(
  userRoles: readonly string[] | undefined | null,
  allowed: readonly RoleCode[],
): boolean {
  if (!userRoles?.length) return false;
  return allowed.some((role) => userRoles.includes(role));
}

export function isElevated(userRoles: readonly string[] | undefined | null): boolean {
  return hasAnyRole(userRoles, ["SUPER_ADMIN", "ADMIN"]);
}

export function displayRoleLabel(role: string): string {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
