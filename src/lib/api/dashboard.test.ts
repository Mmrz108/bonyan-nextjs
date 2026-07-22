import { describe, expect, it, vi, afterEach } from "vitest";
import { todayIsoDate } from "@/lib/api/client";
import { fetchDashboardData } from "@/lib/api/dashboard";

vi.mock("@/lib/api/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/client")>(
    "@/lib/api/client",
  );
  return {
    ...actual,
    fetchCount: vi.fn(),
    fetchPaginated: vi.fn(),
  };
});

import { fetchCount, fetchPaginated } from "@/lib/api/client";

afterEach(() => {
  vi.clearAllMocks();
});

describe("todayIsoDate", () => {
  it("formats local calendar date", () => {
    expect(todayIsoDate(new Date(2026, 6, 22))).toBe("2026-07-22");
  });
});

describe("fetchDashboardData", () => {
  it("aggregates KPI counts and visit lists from DRF endpoints", async () => {
    vi.mocked(fetchCount)
      .mockResolvedValueOnce(12) // total projects
      .mockResolvedValueOnce(7) // active
      .mockResolvedValueOnce(3) // completed
      .mockResolvedValueOnce(4) // upcoming visits
      .mockResolvedValueOnce(2) // submitted reports
      .mockResolvedValueOnce(1) // under review
      .mockResolvedValueOnce(9) // open issues
      .mockResolvedValueOnce(2) // overdue open
      .mockResolvedValueOnce(1); // overdue in progress

    vi.mocked(fetchPaginated)
      .mockResolvedValueOnce({
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: "v1",
            project: "p1",
            project_name: "Tower A",
            title: "Foundation check",
            scheduled_date: "2026-07-20",
            status: "completed",
            created_at: "2026-07-20T10:00:00Z",
          },
        ],
      })
      .mockResolvedValueOnce({
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: "v2",
            project: "p1",
            project_name: "Tower A",
            title: "Slab inspection",
            scheduled_date: "2026-07-25",
            status: "scheduled",
            created_at: "2026-07-21T10:00:00Z",
          },
        ],
      });

    const data = await fetchDashboardData(new Date(2026, 6, 22));

    expect(data.metrics).toEqual({
      totalProjects: 12,
      activeProjects: 7,
      completedProjects: 3,
      upcomingSiteVisits: 4,
      pendingReports: 3,
      openIssues: 9,
      overdueIssues: 3,
    });
    expect(data.recentSiteVisits).toHaveLength(1);
    expect(data.upcomingSiteVisits[0]?.title).toBe("Slab inspection");

    expect(fetchCount).toHaveBeenCalledWith("/projects/", {
      status: "active",
    });
    expect(fetchCount).toHaveBeenCalledWith("/site-visits/", {
      status: "scheduled",
      scheduled_after: "2026-07-22",
    });
    expect(fetchCount).toHaveBeenCalledWith("/issues/", {
      status: "open",
      due_before: "2026-07-22",
    });
  });
});
