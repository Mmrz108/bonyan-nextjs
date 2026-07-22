import { describe, expect, it } from "vitest";
import { getNavItemsForRoles } from "@/lib/auth/navigation";
import {
  canAccessReports,
  canApproveReports,
  canGenerateReportPdf,
  canSubmitReports,
} from "@/lib/auth/permissions";
import { hasAnyRole, isElevated } from "@/lib/auth/roles";

describe("hasAnyRole", () => {
  it("matches overlapping roles", () => {
    expect(hasAnyRole(["CLIENT", "INSPECTOR"], ["INSPECTOR", "ADMIN"])).toBe(
      true,
    );
    expect(hasAnyRole(["CLIENT"], ["ADMIN"])).toBe(false);
    expect(hasAnyRole([], ["ADMIN"])).toBe(false);
  });
});

describe("isElevated", () => {
  it("detects admin roles", () => {
    expect(isElevated(["SUPER_ADMIN"])).toBe(true);
    expect(isElevated(["ADMIN", "CLIENT"])).toBe(true);
    expect(isElevated(["CLIENT"])).toBe(false);
  });
});

describe("report permissions", () => {
  it("allows report access for report roles and elevated", () => {
    expect(canAccessReports(["CLIENT"])).toBe(true);
    expect(canAccessReports(["PROJECT_MANAGER"])).toBe(true);
    expect(canAccessReports(["ADMIN"])).toBe(true);
    expect(canAccessReports(["INSPECTOR"])).toBe(false);
  });

  it("allows submit for field and PM roles", () => {
    expect(canSubmitReports(["INSPECTOR"])).toBe(true);
    expect(canSubmitReports(["SUPERVISOR"])).toBe(true);
    expect(canSubmitReports(["PROJECT_MANAGER"])).toBe(true);
    expect(canSubmitReports(["CLIENT"])).toBe(false);
  });

  it("restricts approve/review/send to elevated or PM", () => {
    expect(canApproveReports(["ADMIN"])).toBe(true);
    expect(canApproveReports(["PROJECT_MANAGER"])).toBe(true);
    expect(canApproveReports(["SUPERVISOR"])).toBe(false);
    expect(canApproveReports(["INSPECTOR"])).toBe(false);
    expect(canApproveReports(["CLIENT"])).toBe(false);
  });

  it("allows PDF generation for field roles", () => {
    expect(canGenerateReportPdf(["INSPECTOR"])).toBe(true);
    expect(canGenerateReportPdf(["CLIENT"])).toBe(false);
  });
});

describe("getNavItemsForRoles", () => {
  it("shows client-safe navigation only", () => {
    const keys = getNavItemsForRoles(["CLIENT"]).map((item) => item.key);
    expect(keys).toEqual(["dashboard", "projects", "reports"]);
  });

  it("shows inspector inspection modules", () => {
    const keys = getNavItemsForRoles(["INSPECTOR"]).map((item) => item.key);
    expect(keys).toContain("siteVisits");
    expect(keys).toContain("issues");
    expect(keys).not.toContain("settings");
    expect(keys).not.toContain("reports");
  });

  it("shows settings for admins", () => {
    const keys = getNavItemsForRoles(["ADMIN"]).map((item) => item.key);
    expect(keys).toContain("settings");
    expect(keys).toContain("reports");
    expect(keys).toContain("issues");
  });
});
