"use client";

import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderKanban,
  MapPinned,
  PlayCircle,
} from "lucide-react";
import { useDashboardQuery } from "@/hooks/use-dashboard";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import { ProjectsChart } from "@/components/dashboard/projects-chart";
import { IssuesChart } from "@/components/dashboard/issues-chart";
import { SiteVisitsPanel } from "@/components/dashboard/site-visits-panel";
import { ErrorState, PageLoader } from "@/components/ui/states";
import { useAuth } from "@/components/providers/auth-provider";

export function DashboardView() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const query = useDashboardQuery();

  if (query.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Header
          welcome={t("welcomeNamed", {
            name: user?.first_name || user?.full_name || t("welcomeGuest"),
          })}
          description={t("description")}
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
        <PageLoader label={tCommon("loading")} />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <ErrorState
          title={t("errorTitle")}
          description={t("errorDescription")}
          onRetry={() => void query.refetch()}
          retryLabel={tCommon("retry")}
        />
      </div>
    );
  }

  const { metrics, recentSiteVisits, upcomingSiteVisits } = query.data;
  const allEmpty =
    metrics.totalProjects === 0 &&
    metrics.upcomingSiteVisits === 0 &&
    metrics.pendingReports === 0 &&
    metrics.openIssues === 0 &&
    recentSiteVisits.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <Header
        welcome={t("welcomeNamed", {
          name: user?.first_name || user?.full_name || t("welcomeGuest"),
        })}
        description={t("description")}
      />

      <section
        aria-label={t("metricsSection")}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label={t("totalProjects")}
          value={metrics.totalProjects}
          description={t("totalProjectsHint")}
          icon={<FolderKanban className="h-5 w-5" />}
          tone="default"
        />
        <StatCard
          label={t("activeProjects")}
          value={metrics.activeProjects}
          description={t("activeProjectsHint")}
          icon={<PlayCircle className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label={t("completedProjects")}
          value={metrics.completedProjects}
          description={t("completedProjectsHint")}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="accent"
        />
        <StatCard
          label={t("upcomingSiteVisits")}
          value={metrics.upcomingSiteVisits}
          description={t("upcomingSiteVisitsHint")}
          icon={<MapPinned className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label={t("pendingReports")}
          value={metrics.pendingReports}
          description={t("pendingReportsHint")}
          icon={<FileText className="h-5 w-5" />}
          tone="default"
        />
        <StatCard
          label={t("openIssues")}
          value={metrics.openIssues}
          description={t("openIssuesHint")}
          icon={<ClipboardList className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label={t("overdueIssues")}
          value={metrics.overdueIssues}
          description={t("overdueIssuesHint")}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="danger"
          className="sm:col-span-2 xl:col-span-1"
        />
      </section>

      {allEmpty ? (
        <div className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface-elevated)]/80 px-6 py-14 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
            Bonyan
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            {t("emptyWorkspaceTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--muted)]">
            {t("emptyWorkspaceDescription")}
          </p>
        </div>
      ) : (
        <>
          <section
            aria-label={t("chartsSection")}
            className="grid gap-4 lg:grid-cols-2"
          >
            <ProjectsChart
              total={metrics.totalProjects}
              active={metrics.activeProjects}
              completed={metrics.completedProjects}
            />
            <IssuesChart
              open={metrics.openIssues}
              overdue={metrics.overdueIssues}
            />
          </section>

          <section
            aria-label={t("visitsSection")}
            className="grid gap-4 lg:grid-cols-2"
          >
            <SiteVisitsPanel
              title={t("upcomingVisitsTitle")}
              description={t("upcomingVisitsHint")}
              visits={upcomingSiteVisits}
              emptyTitle={t("emptyUpcomingTitle")}
              emptyDescription={t("emptyUpcomingDescription")}
              variant="upcoming"
            />
            <SiteVisitsPanel
              title={t("recentVisitsTitle")}
              description={t("recentVisitsHint")}
              visits={recentSiteVisits}
              emptyTitle={t("emptyRecentTitle")}
              emptyDescription={t("emptyRecentDescription")}
              variant="recent"
            />
          </section>
        </>
      )}
    </div>
  );
}

function Header({
  welcome,
  description,
}: {
  welcome: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
        Bonyan
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
        {welcome}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)] sm:text-base">
        {description}
      </p>
    </div>
  );
}
