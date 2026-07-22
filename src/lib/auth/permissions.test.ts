import { describe, expect, it } from "vitest";
import {
  canAccessSiteVisits,
  canManageProjects,
  canManageSiteVisits,
  canPerformSiteVisits,
  canViewReportsTab,
} from "@/lib/auth/permissions";

describe("project / visit UI permissions", () => {
  it("limits project management to elevated and PM", () => {
    expect(canManageProjects(["ADMIN"])).toBe(true);
    expect(canManageProjects(["PROJECT_MANAGER"])).toBe(true);
    expect(canManageProjects(["SUPERVISOR"])).toBe(false);
    expect(canManageSiteVisits(["CLIENT"])).toBe(false);
  });

  it("allows site visit access for inspection roles", () => {
    expect(canAccessSiteVisits(["SUPERVISOR"])).toBe(true);
    expect(canAccessSiteVisits(["INSPECTOR"])).toBe(true);
    expect(canAccessSiteVisits(["CLIENT"])).toBe(false);
  });

  it("allows field perform actions for supervisors and PMs", () => {
    expect(canPerformSiteVisits(["SUPERVISOR"])).toBe(true);
    expect(canPerformSiteVisits(["PROJECT_MANAGER"])).toBe(true);
    expect(canPerformSiteVisits(["CLIENT"])).toBe(false);
  });

  it("shows reports tab for report roles", () => {
    expect(canViewReportsTab(["CLIENT"])).toBe(true);
    expect(canViewReportsTab(["INSPECTOR"])).toBe(false);
  });
});
