"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  canManageProjects,
  canManageStages,
  canViewReportsTab,
} from "@/lib/auth/permissions";
import { isApiError } from "@/lib/api/client";
import { useProjectMutations, useProjectQuery } from "@/hooks/use-projects";
import {
  ProjectLocationMap,
  toMapMarkers,
} from "@/components/projects/project-location-map";
import { ProjectMembersPanel } from "@/components/projects/project-members-panel";
import { ProjectStagesPanel } from "@/components/projects/project-stages-panel";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectStatusBadge } from "@/components/projects/status-badges";
import {
  ProjectContractPanel,
  ProjectIssuesPanel,
  ProjectReportsPanel,
  ProjectVisitsPanel,
} from "@/components/projects/project-related-panels";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { EmptyState, ErrorState, PageLoader } from "@/components/ui/states";

type ProjectTab =
  | "overview"
  | "contract"
  | "stages"
  | "visits"
  | "issues"
  | "reports";

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const canManage = canManageProjects(user?.roles);
  const canStages = canManageStages(user?.roles);
  const showReports = canViewReportsTab(user?.roles);

  const query = useProjectQuery(projectId);
  const { remove } = useProjectMutations(projectId);
  const [tab, setTab] = useState<ProjectTab>("overview");
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const markers = useMemo(
    () => (query.data ? toMapMarkers(query.data) : []),
    [query.data],
  );

  if (query.isPending) return <PageLoader label={tCommon("loading")} />;

  if (query.isError) {
    return (
      <ErrorState
        title={t("errors.loadDetail")}
        description={
          isApiError(query.error) && query.error.status === 404
            ? t("errors.notFound")
            : t("errors.loadDetailHint")
        }
        onRetry={() => void query.refetch()}
        retryLabel={tCommon("retry")}
      />
    );
  }

  const project = query.data;
  const displayName =
    locale === "ar" && project.name_ar ? project.name_ar : project.name;

  async function onDelete() {
    if (!window.confirm(t("actions.deleteConfirm"))) return;
    setActionError(null);
    try {
      await remove.mutateAsync(project.id);
      router.replace("/projects");
    } catch (error) {
      if (isApiError(error) && error.status === 403) {
        setActionError(t("errors.forbidden"));
        return;
      }
      setActionError(t("errors.saveFailed"));
    }
  }

  const tabs = [
    { id: "overview" as const, label: t("tabs.overview") },
    { id: "contract" as const, label: t("tabs.contract") },
    { id: "stages" as const, label: t("tabs.stages") },
    { id: "visits" as const, label: t("tabs.visits") },
    { id: "issues" as const, label: t("tabs.issues") },
    {
      id: "reports" as const,
      label: t("tabs.reports"),
      hidden: !showReports,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("backToList")}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-[var(--brand)]">{project.code}</p>
            <ProjectStatusBadge status={project.status} />
          </div>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
            {displayName}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {[project.client_name, project.contract_reference, project.location]
              .filter(Boolean)
              .join(" · ") || t("noMeta")}
          </p>
        </div>

        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="gap-1.5"
              onClick={() => setEditing((open) => !open)}
            >
              <Pencil className="h-4 w-4" />
              {editing ? t("actions.cancel") : t("actions.edit")}
            </Button>
            <Button
              type="button"
              variant="danger"
              className="gap-1.5"
              onClick={() => void onDelete()}
              loading={remove.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {t("actions.delete")}
            </Button>
          </div>
        ) : null}
      </div>

      {actionError ? <Alert tone="danger">{actionError}</Alert> : null}

      {editing && canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("editTitle")}</CardTitle>
            <CardDescription>{t("editHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectForm
              project={project}
              onCancel={() => setEditing(false)}
              onSuccess={() => setEditing(false)}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="pt-4">
          <Tabs
            items={tabs}
            value={tab}
            onChange={(next) => setTab(next)}
          />

          <TabPanel>
            {tab === "overview" ? (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <div className="space-y-5">
                  <section>
                    <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
                      {t("overviewTitle")}
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--ink-soft)]">
                      {project.description || t("noDescription")}
                    </p>
                  </section>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <Meta label={t("fields.type")} value={t(`type.${project.project_type}`)} />
                    <Meta label={t("fields.client")} value={project.client_name || "—"} />
                    <Meta
                      label={t("fields.contract")}
                      value={project.contract_reference || "—"}
                    />
                    <Meta label={t("fields.address")} value={project.address || "—"} />
                    <Meta label={t("fields.startDate")} value={project.start_date || "—"} />
                    <Meta
                      label={t("fields.expectedCompletion")}
                      value={project.expected_completion_date || "—"}
                    />
                  </dl>
                  <ProjectMembersPanel project={project} canManage={canManage} />
                </div>
                <div className="space-y-3">
                  <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
                    {t("mapTitle")}
                  </h3>
                  <ProjectLocationMap markers={markers} />
                  {project.locations.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {project.locations.map((location) => (
                        <li
                          key={location.id}
                          className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
                        >
                          <p className="font-medium text-[var(--ink)]">
                            {location.name}
                            {location.is_primary ? (
                              <span className="ms-2 text-xs text-[var(--accent)]">
                                {t("primaryLocation")}
                              </span>
                            ) : null}
                          </p>
                          <p className="text-[var(--muted)]">
                            {[location.city, location.region, location.country_code]
                              .filter(Boolean)
                              .join(", ") || location.address_line1 || "—"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : markers.length === 0 ? (
                    <EmptyState
                      title={t("mapEmptyTitle")}
                      description={t("mapEmptyDescription")}
                      className="py-6"
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            {tab === "contract" ? (
              <ProjectContractPanel contractId={project.contract} />
            ) : null}

            {tab === "stages" ? (
              <ProjectStagesPanel projectId={project.id} canManage={canStages} />
            ) : null}

            {tab === "visits" ? (
              <ProjectVisitsPanel projectId={project.id} />
            ) : null}

            {tab === "issues" ? (
              <ProjectIssuesPanel projectId={project.id} />
            ) : null}

            {tab === "reports" && showReports ? (
              <ProjectReportsPanel projectId={project.id} />
            ) : null}
          </TabPanel>
        </CardContent>
      </Card>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
      <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[var(--ink)]">{value}</dd>
    </div>
  );
}
