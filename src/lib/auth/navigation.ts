import type { RoleCode } from "@/lib/auth/types";
import {
  ALL_ROLES,
  INSPECTION_ROLES,
  REPORT_ROLES,
  SETTINGS_ROLES,
  hasAnyRole,
} from "@/lib/auth/roles";

export type NavItemConfig = {
  href: string;
  key:
    | "dashboard"
    | "projects"
    | "siteVisits"
    | "issues"
    | "reports"
    | "settings";
  roles: readonly RoleCode[];
  /** When false, item is visible but marked coming soon (no business page yet). */
  implemented: boolean;
};

export const NAV_ITEMS: readonly NavItemConfig[] = [
  {
    href: "/dashboard",
    key: "dashboard",
    roles: ALL_ROLES,
    implemented: true,
  },
  {
    href: "/projects",
    key: "projects",
    roles: ALL_ROLES,
    implemented: true,
  },
  {
    href: "/site-visits",
    key: "siteVisits",
    roles: INSPECTION_ROLES,
    implemented: true,
  },
  {
    href: "/issues",
    key: "issues",
    roles: INSPECTION_ROLES,
    implemented: false,
  },
  {
    href: "/reports",
    key: "reports",
    roles: REPORT_ROLES,
    implemented: true,
  },
  {
    href: "/settings",
    key: "settings",
    roles: SETTINGS_ROLES,
    implemented: false,
  },
] as const;

export function getNavItemsForRoles(
  userRoles: readonly string[] | undefined | null,
): NavItemConfig[] {
  return NAV_ITEMS.filter((item) => hasAnyRole(userRoles, item.roles));
}
