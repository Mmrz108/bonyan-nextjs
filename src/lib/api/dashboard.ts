import { apiGet, todayIsoDate } from "@/lib/api/client";
import type {
  DashboardData,
  IssueListItem,
  ProjectListItem,
  ReportListItem,
  SiteVisitListItem,
} from "@/lib/api/types";

/**
 * Load dashboard KPIs via a single Next.js backend endpoint.
 * Avoids many parallel BFF calls (fragile on Vercel serverless SQLite).
 */
export async function fetchDashboardData(
  now = new Date(),
): Promise<DashboardData> {
  const today = todayIsoDate(now);
  return apiGet<DashboardData>(`/dashboard/summary?today=${today}`);
}

/** Kept for typed reuse / tests. */
export type {
  ProjectListItem,
  SiteVisitListItem,
  ReportListItem,
  IssueListItem,
};
