import { fetchCount, fetchPaginated, todayIsoDate } from "@/lib/api/client";
import type {
  DashboardData,
  IssueListItem,
  ProjectListItem,
  ReportListItem,
  SiteVisitListItem,
} from "@/lib/api/types";

const PROJECTS = "/projects/";
const SITE_VISITS = "/site-visits/";
const REPORTS = "/reports/";
const ISSUES = "/issues/";

/**
 * Load dashboard KPIs and lists from DRF list endpoints.
 * Counts use pagination `count`; lists use the first page of results.
 */
export async function fetchDashboardData(
  now = new Date(),
): Promise<DashboardData> {
  const today = todayIsoDate(now);

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    upcomingCount,
    submittedReports,
    underReviewReports,
    openIssues,
    overdueOpenIssues,
    overdueInProgressIssues,
    recentVisitsPage,
    upcomingVisitsPage,
  ] = await Promise.all([
    fetchCount(PROJECTS),
    fetchCount(PROJECTS, { status: "active" }),
    fetchCount(PROJECTS, { status: "completed" }),
    fetchCount(SITE_VISITS, {
      status: "scheduled",
      scheduled_after: today,
    }),
    fetchCount(REPORTS, { status: "submitted" }),
    fetchCount(REPORTS, { status: "under_review" }),
    fetchCount(ISSUES, { status: "open" }),
    fetchCount(ISSUES, { status: "open", due_before: today }),
    fetchCount(ISSUES, { status: "in_progress", due_before: today }),
    fetchPaginated<SiteVisitListItem>(SITE_VISITS, {
      status: "completed",
      ordering: "-scheduled_date",
    }),
    fetchPaginated<SiteVisitListItem>(SITE_VISITS, {
      status: "scheduled",
      scheduled_after: today,
      ordering: "scheduled_date",
    }),
  ]);

  return {
    metrics: {
      totalProjects,
      activeProjects,
      completedProjects,
      upcomingSiteVisits: upcomingCount,
      pendingReports: submittedReports + underReviewReports,
      openIssues,
      overdueIssues: overdueOpenIssues + overdueInProgressIssues,
    },
    recentSiteVisits: recentVisitsPage.results.slice(0, 8),
    upcomingSiteVisits: upcomingVisitsPage.results.slice(0, 8),
  };
}

/** Kept for typed reuse / tests. */
export type {
  ProjectListItem,
  SiteVisitListItem,
  ReportListItem,
  IssueListItem,
};
