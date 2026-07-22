"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { canManageProjects } from "@/lib/auth/permissions";
import { useProjectsQuery } from "@/hooks/use-projects";
import type { ProjectListParams } from "@/lib/api/types";
import { ProjectFilters } from "@/components/projects/project-filters";
import { ProjectStatusBadge } from "@/components/projects/status-badges";
import { ProjectForm } from "@/components/projects/project-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState, ErrorState, PageLoader } from "@/components/ui/states";

export function ProjectListView() {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const canManage = canManageProjects(user?.roles);
  const [filters, setFilters] = useState<ProjectListParams>({
    page: 1,
    ordering: "-created_at",
  });
  const [showCreate, setShowCreate] = useState(false);

  const query = useProjectsQuery(filters);
  const totalPages = useMemo(() => {
    if (!query.data) return 1;
    return Math.max(1, Math.ceil(query.data.count / 20));
  }, [query.data]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
            Bonyan
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)] sm:text-base">
            {t("description")}
          </p>
        </div>
        {canManage ? (
          <Button
            type="button"
            onClick={() => setShowCreate((open) => !open)}
            className="gap-2 self-start"
          >
            <Plus className="h-4 w-4" />
            {showCreate ? t("actions.closeForm") : t("actions.create")}
          </Button>
        ) : null}
      </div>

      {showCreate && canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("createTitle")}</CardTitle>
            <CardDescription>{t("createHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectForm
              onCancel={() => setShowCreate(false)}
              onSuccess={(project) => {
                setShowCreate(false);
                router.push(`/projects/${project.id}`);
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      <ProjectFilters value={filters} onChange={setFilters} />

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
            canManage ? (
              <Button type="button" onClick={() => setShowCreate(true)}>
                {t("actions.create")}
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
                <thead className="bg-[var(--surface-muted)]/70 text-start text-xs uppercase tracking-wide text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("fields.code")}</th>
                    <th className="px-4 py-3 font-medium">{t("fields.name")}</th>
                    <th className="px-4 py-3 font-medium">{t("fields.status")}</th>
                    <th className="px-4 py-3 font-medium">{t("fields.type")}</th>
                    <th className="px-4 py-3 font-medium">{t("fields.client")}</th>
                    <th className="px-4 py-3 font-medium">{t("fields.location")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {query.data.results.map((project) => {
                    const displayName =
                      locale === "ar" && project.name_ar
                        ? project.name_ar
                        : project.name;
                    return (
                      <tr
                        key={project.id}
                        className="hover:bg-[var(--brand-tint)]/40"
                      >
                        <td className="px-4 py-3 font-medium text-[var(--brand)]">
                          <Link href={`/projects/${project.id}`}>{project.code}</Link>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/projects/${project.id}`}
                            className="font-medium text-[var(--ink)] hover:underline"
                          >
                            {displayName}
                          </Link>
                          {project.contract_reference ? (
                            <p className="mt-0.5 text-xs text-[var(--muted)]">
                              {project.contract_reference}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <ProjectStatusBadge status={project.status} />
                        </td>
                        <td className="px-4 py-3 text-[var(--ink-soft)]">
                          {t(`type.${project.project_type}`)}
                        </td>
                        <td className="px-4 py-3 text-[var(--ink-soft)]">
                          {project.client_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-[var(--ink-soft)]">
                          {project.location || "—"}
                        </td>
                      </tr>
                    );
                  })}
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
