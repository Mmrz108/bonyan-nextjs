"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  canAccessReports,
  canSubmitReports,
} from "@/lib/auth/permissions";
import { useReportsQuery } from "@/hooks/use-reports";
import type { ReportListParams } from "@/lib/api/types";
import { ReportFilters } from "@/components/reports/report-filters";
import { ReportCreateForm } from "@/components/reports/report-create-form";
import {
  PdfStatusBadge,
  ReportStatusBadge,
} from "@/components/reports/report-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState, ErrorState, PageLoader } from "@/components/ui/states";

export function ReportListView() {
  const t = useTranslations("reports");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const canAccess = canAccessReports(user?.roles);
  const canSubmit = canSubmitReports(user?.roles);

  const [filters, setFilters] = useState<ReportListParams>({
    page: 1,
    ordering: "-created_at",
  });
  const [showCreate, setShowCreate] = useState(false);
  const query = useReportsQuery(filters);

  const totalPages = useMemo(() => {
    if (!query.data) return 1;
    return Math.max(1, Math.ceil(query.data.count / 20));
  }, [query.data]);

  if (!canAccess) {
    return (
      <ErrorState
        title={t("errors.forbidden")}
        description={t("errors.forbiddenHint")}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
            Bonyan
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            {t("description")}
          </p>
        </div>
        {canSubmit ? (
          <Button
            type="button"
            className="gap-2 self-start"
            onClick={() => setShowCreate((open) => !open)}
          >
            <Plus className="h-4 w-4" />
            {showCreate ? t("actions.close") : t("actions.createDraft")}
          </Button>
        ) : null}
      </div>

      {showCreate && canSubmit ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("createTitle")}</CardTitle>
            <CardDescription>{t("createHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportCreateForm
              onCancel={() => setShowCreate(false)}
              onSuccess={(report) => {
                setShowCreate(false);
                router.push(`/reports/${report.id}`);
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      <ReportFilters value={filters} onChange={setFilters} />

      {query.isPending ? <PageLoader label={tCommon("loading")} /> : null}

      {query.isError ? (
        <ErrorState
          title={t("errors.loadList")}
          description={t("errors.loadListHint")}
          onRetry={() => void query.refetch()}
          retryLabel={tCommon("retry")}
        />
      ) : null}

      {query.isSuccess && query.data.results.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            canSubmit ? (
              <Button type="button" onClick={() => setShowCreate(true)}>
                {t("actions.createDraft")}
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {query.isSuccess && query.data.results.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-elevated)]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--surface-muted)]/70 text-xs uppercase tracking-wide text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">
                      {t("fields.title")}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t("fields.project")}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t("fields.status")}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t("fields.pdf")}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t("fields.created")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {query.data.results.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-[var(--brand-tint)]/40"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/reports/${report.id}`}
                          className="font-medium text-[var(--ink)] hover:underline"
                        >
                          {report.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-[var(--muted)]">
                          {report.site_visit_title}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-soft)]">
                        {report.project_name}
                      </td>
                      <td className="px-4 py-3">
                        <ReportStatusBadge status={report.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PdfStatusBadge status={report.pdf_status} />
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-soft)]">
                        {formatDate(report.created_at, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
            <p>
              {t("pagination", {
                count: query.data.count,
                page: filters.page ?? 1,
                pages: totalPages,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={(filters.page ?? 1) <= 1}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.max(1, (prev.page ?? 1) - 1),
                  }))
                }
              >
                {t("actions.prev")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={(filters.page ?? 1) >= totalPages}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: (prev.page ?? 1) + 1,
                  }))
                }
              >
                {t("actions.next")}
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
