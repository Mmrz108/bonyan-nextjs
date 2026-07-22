import { describe, expect, it } from "vitest";
import { formatCoord } from "@/lib/site-visits/geo";
import {
  canAccessSiteVisits,
  canPerformSiteVisits,
} from "@/lib/auth/permissions";
import {
  enqueueOfflineAction,
  listOfflineQueue,
  clearOfflineQueue,
} from "@/lib/site-visits/offline-queue";

describe("site visit permissions (UI only)", () => {
  it("allows inspection roles to access visits", () => {
    expect(canAccessSiteVisits(["SUPERVISOR"])).toBe(true);
    expect(canAccessSiteVisits(["CLIENT"])).toBe(false);
  });

  it("allows field perform for supervisors and inspectors", () => {
    expect(canPerformSiteVisits(["INSPECTOR"])).toBe(true);
    expect(canPerformSiteVisits(["PROJECT_MANAGER"])).toBe(true);
  });
});

describe("formatCoord", () => {
  it("formats GPS decimals for the API", () => {
    expect(formatCoord(24.7136)).toBe("24.7136000");
  });
});

describe("offline queue", () => {
  it("stores and lists queued actions", () => {
    clearOfflineQueue();
    enqueueOfflineAction({
      kind: "check_in",
      label: "Check in",
      payload: { visitId: "v1" },
    });
    expect(listOfflineQueue()).toHaveLength(1);
    clearOfflineQueue();
    expect(listOfflineQueue()).toHaveLength(0);
  });
});
