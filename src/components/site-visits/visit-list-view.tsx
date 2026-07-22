"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  canAccessSiteVisits,
  canPerformSiteVisits,
} from "@/lib/auth/permissions";
import { useSiteVisitsQuery } from "@/hooks/use-site-visits";
import type { SiteVisitListParams } from "@/lib/api/types";
import { OfflineBanner } from "@/components/site-visits/offline-banner";
import { VisitFilters } from "@/components/site-visits/visit-filters";
import { VisitCreateForm } from "@/components/site-visits/visit-create-form";
import { VisitStatusBadge } from "@/components/site-visits/visit-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState, ErrorState, PageLoader } from "@/components/ui/states";

export function VisitListView() {
  const t = useTranslations("siteVisits");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const canAccess = canAccessSiteVisits(user?.roles);
  const canPerform = canPerformSiteVisits(user?.roles);

  const [filters, setFilters] = useState<SiteVisitListParams>({
    page: 1,
    ordering: "-scheduled_date,-created_at",
  });
  const [showCreate, setShowCreate] = useState(false);
  const query = useSiteVisitsQuery(filters);

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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-24 sm:max-w-5xl sm:gap-6">
      <OfflineBanner />

      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
            Bonyan
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)] sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t("description")}</p>
        </div>
        {canPerform ? (
          <Button
            type="button"
            size="sm"
            className="shrink-0 gap-1"
            onClick={() => setShowCreate((open) => !open)}
          >
            <Plus className="h-4 w-4" />
            {showCreate ? t("actions.close") : t("actions.new")}
          </Button>
        ) : null}
      </div>

      {showCreate && canPerform ? (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">{t("createTitle")}</CardTitle>
            <CardDescription>{t("createHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <VisitCreateForm
              onCancel={() => setShowCreate(false)}
              onSuccess={(visit) => {
                setShowCreate(false);
                router.push(`/site-visits/${visit.id}`);
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      <VisitFilters value={filters} onChange={setFilters} />

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
            canPerform ? (
              <Button type="button" onClick={() => setShowCreate(true)}>
                {t("actions.create")}
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {query.isSuccess && query.data.results.length > 0 ? (
        <>
          <ul className="space-y-3">
            {query.data.results.map((visit) => (
              <li key={visit.id}>
                <Link
                  href={`/site-visits/${visit.id}`}
                  className="block rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4 shadow-[0_1px_0_rgba(21,32,29,0.04)] active:bg-[var(--brand-tint)]/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--ink)]">
                        {visit.title}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                        {visit.project_name}
                        {visit.stage_name ? ` · ${visit.stage_name}` : ""}
                      </p>
                    </div>
                    <VisitStatusBadge status={visit.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--ink-soft)]">
                    <span>
                      {visit.scheduled_date
                        ? formatDate(visit.scheduled_date, locale)
                        : t("unscheduled")}
                    </span>
                    {visit.assigned_to_email ? (
                      <span className="truncate">{visit.assigned_to_email}</span>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

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
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}
