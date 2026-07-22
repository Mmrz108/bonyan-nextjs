"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, PageLoader } from "@/components/ui/states";
import {
  useContractQuery,
  useProjectIssuesQuery,
  useProjectReportsQuery,
  useProjectVisitsQuery,
} from "@/hooks/use-projects";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";

export function ProjectContractPanel({
  contractId,
}: {
  contractId: string | null;
}) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const query = useContractQuery(contractId);

  if (!contractId) {
    return (
      <EmptyState
        title={t("contractEmptyTitle")}
        description={t("contractEmptyDescription")}
        className="py-8"
      />
    );
  }

  if (query.isPending) return <PageLoader label={tCommon("loading")} />;
  if (query.isError) {
    return (
      <ErrorState
        title={t("errors.loadContract")}
        onRetry={() => void query.refetch()}
        retryLabel={tCommon("retry")}
      />
    );
  }

  const contract = query.data;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
          {contract.title}
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {contract.reference_code}
          {contract.client_name ? ` · ${contract.client_name}` : ""}
        </p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <Info label={t("fields.status")} value={t(`contractStatus.${contract.status}`)} />
        <Info
          label={t("fields.plannedVisits")}
          value={
            contract.planned_visits_per_month != null
              ? String(contract.planned_visits_per_month)
              : "—"
          }
        />
        <Info label={t("fields.startDate")} value={contract.start_date || "—"} />
        <Info label={t("fields.endDate")} value={contract.end_date || "—"} />
      </dl>
      {contract.scope_summary ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            {t("fields.scope")}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--ink-soft)]">
            {contract.scope_summary}
          </p>
        </div>
      ) : null}
      {contract.notes ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            {t("fields.notes")}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--ink-soft)]">
            {contract.notes}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
      <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[var(--ink)]">{value}</dd>
    </div>
  );
}

export function ProjectVisitsPanel({ projectId }: { projectId: string }) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const query = useProjectVisitsQuery(projectId);

  if (query.isPending) return <PageLoader label={tCommon("loading")} />;
  if (query.isError) {
    return (
      <ErrorState
        title={t("errors.loadVisits")}
        onRetry={() => void query.refetch()}
        retryLabel={tCommon("retry")}
      />
    );
  }

  if (query.data.results.length === 0) {
    return (
      <EmptyState
        title={t("visitsEmptyTitle")}
        description={t("visitsEmptyDescription")}
        className="py-8"
      />
    );
  }

  return (
    <RelatedTable
      headers={[t("fields.title"), t("fields.date"), t("fields.status"), t("fields.assignee")]}
      rows={query.data.results.map((visit) => [
        visit.title,
        formatDate(visit.scheduled_date || "", locale) || "—",
        <Badge key="s" tone="brand">
          {t(`visitStatus.${visit.status}`)}
        </Badge>,
        visit.assigned_to_email || "—",
      ])}
    />
  );
}

export function ProjectIssuesPanel({ projectId }: { projectId: string }) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const query = useProjectIssuesQuery(projectId);

  if (query.isPending) return <PageLoader label={tCommon("loading")} />;
  if (query.isError) {
    return (
      <ErrorState
        title={t("errors.loadIssues")}
        onRetry={() => void query.refetch()}
        retryLabel={tCommon("retry")}
      />
    );
  }

  if (query.data.results.length === 0) {
    return (
      <EmptyState
        title={t("issuesEmptyTitle")}
        description={t("issuesEmptyDescription")}
        className="py-8"
      />
    );
  }

  return (
    <RelatedTable
      headers={[
        t("fields.title"),
        t("fields.severity"),
        t("fields.status"),
        t("fields.dueDate"),
      ]}
      rows={query.data.results.map((issue) => [
        issue.title,
        <Badge key="sev" tone={issue.severity === "critical" || issue.severity === "high" ? "danger" : "warning"}>
          {t(`severity.${issue.severity}`)}
        </Badge>,
        <Badge key="st" tone="brand">
          {t(`issueStatus.${issue.status}`)}
        </Badge>,
        issue.due_date ? formatDate(issue.due_date, locale) : "—",
      ])}
    />
  );
}

export function ProjectReportsPanel({ projectId }: { projectId: string }) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const query = useProjectReportsQuery(projectId);

  if (query.isPending) return <PageLoader label={tCommon("loading")} />;
  if (query.isError) {
    return (
      <ErrorState
        title={t("errors.loadReports")}
        onRetry={() => void query.refetch()}
        retryLabel={tCommon("retry")}
      />
    );
  }

  if (query.data.results.length === 0) {
    return (
      <EmptyState
        title={t("reportsEmptyTitle")}
        description={t("reportsEmptyDescription")}
        className="py-8"
      />
    );
  }

  return (
    <RelatedTable
      headers={[t("fields.title"), t("fields.status"), t("fields.author"), t("fields.created")]}
      rows={query.data.results.map((report) => [
        <Link
          key="title"
          href={`/reports/${report.id}`}
          className="font-medium text-[var(--ink)] hover:underline"
        >
          {report.title}
        </Link>,
        <ReportStatusBadge key="st" status={report.status} />,
        report.author_email || "—",
        formatDateTime(report.created_at, locale),
      ])}
    />
  );
}

function RelatedTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<React.ReactNode>>;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-elevated)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--surface-muted)]/70 text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-start font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 text-[var(--ink-soft)]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(value: string, locale: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
