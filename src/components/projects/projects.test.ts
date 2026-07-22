import { describe, expect, it } from "vitest";
import {
  canManageProjects,
  canViewReportsTab,
} from "@/lib/auth/permissions";
import { toMapMarkers } from "@/lib/projects/map-markers";

describe("project RBAC helpers (UI only)", () => {
  it("allows manage for PM and elevated roles", () => {
    expect(canManageProjects(["PROJECT_MANAGER"])).toBe(true);
    expect(canManageProjects(["ADMIN"])).toBe(true);
    expect(canManageProjects(["INSPECTOR"])).toBe(false);
    expect(canManageProjects(["CLIENT"])).toBe(false);
  });

  it("hides reports tab for inspectors", () => {
    expect(canViewReportsTab(["CLIENT"])).toBe(true);
    expect(canViewReportsTab(["INSPECTOR"])).toBe(false);
    expect(canViewReportsTab(["SUPERVISOR"])).toBe(true);
  });
});

describe("toMapMarkers", () => {
  it("builds markers from project and location coordinates", () => {
    const markers = toMapMarkers({
      location: "Riyadh site",
      latitude: "24.7136",
      longitude: "46.6753",
      locations: [
        {
          id: "loc-1",
          name: "Gate B",
          city: "Riyadh",
          latitude: "24.72",
          longitude: "46.68",
          is_primary: false,
        },
      ],
    });
    expect(markers).toHaveLength(2);
    expect(markers[0]?.primary).toBe(true);
    expect(markers[1]?.label).toContain("Gate B");
  });
});
