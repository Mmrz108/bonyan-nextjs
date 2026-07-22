import type { RoleCode } from "@/lib/auth/types";
import {
  hasAnyRole,
  isElevated,
  INSPECTION_ROLES,
  REPORT_ROLES,
} from "@/lib/auth/roles";

/** UI-only capability helpers. Backend remains the security boundary. */

export const PROJECT_MANAGE_ROLES: RoleCode[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "PROJECT_MANAGER",
];

export function canManageProjects(
  roles: readonly string[] | undefined | null,
): boolean {
  return hasAnyRole(roles, PROJECT_MANAGE_ROLES);
}

export function canManageStages(
  roles: readonly string[] | undefined | null,
): boolean {
  return canManageProjects(roles);
}

export function canViewReportsTab(
  roles: readonly string[] | undefined | null,
): boolean {
  return hasAnyRole(roles, REPORT_ROLES) || isElevated(roles);
}

export function canAccessSiteVisits(
  roles: readonly string[] | undefined | null,
): boolean {
  return hasAnyRole(roles, INSPECTION_ROLES);
}

/** Field actions: check-in/out, checklist, issues — UI hint only. */
export function canPerformSiteVisits(
  roles: readonly string[] | undefined | null,
): boolean {
  return (
    isElevated(roles) ||
    hasAnyRole(roles, ["PROJECT_MANAGER", "SUPERVISOR", "INSPECTOR"])
  );
}

export function canManageSiteVisits(
  roles: readonly string[] | undefined | null,
): boolean {
  return canManageProjects(roles);
}

export function canAccessReports(
  roles: readonly string[] | undefined | null,
): boolean {
  return hasAnyRole(roles, REPORT_ROLES) || isElevated(roles);
}

/** Create / submit / edit drafts — UI hint only. */
export function canSubmitReports(
  roles: readonly string[] | undefined | null,
): boolean {
  return (
    isElevated(roles) ||
    hasAnyRole(roles, ["PROJECT_MANAGER", "SUPERVISOR", "INSPECTOR"])
  );
}

/**
 * Review / approve / reject / send — UI hint only.
 * Backend: elevated or project PM. Supervisors cannot approve.
 */
export function canApproveReports(
  roles: readonly string[] | undefined | null,
): boolean {
  return isElevated(roles) || hasAnyRole(roles, ["PROJECT_MANAGER"]);
}

export function canGenerateReportPdf(
  roles: readonly string[] | undefined | null,
): boolean {
  return (
    isElevated(roles) ||
    hasAnyRole(roles, ["PROJECT_MANAGER", "SUPERVISOR", "INSPECTOR"])
  );
}
