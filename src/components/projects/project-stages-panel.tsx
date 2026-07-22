"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { ProjectStage } from "@/lib/api/types";
import { isApiError } from "@/lib/api/client";
import {
  useProjectMutations,
  useProjectStagesQuery,
} from "@/hooks/use-projects";
import { StageForm } from "@/components/projects/stage-form";
import { StageStatusBadge } from "@/components/projects/status-badges";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, PageLoader } from "@/components/ui/states";

type ProjectStagesPanelProps = {
  projectId: string;
  canManage: boolean;
};

export function ProjectStagesPanel({
  projectId,
  canManage,
}: ProjectStagesPanelProps) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const query = useProjectStagesQuery(projectId);
  const { removeStage } = useProjectMutations(projectId);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ProjectStage | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (query.isPending) return <PageLoader label={tCommon("loading")} />;
  if (query.isError) {
    return (
      <ErrorState
        title={t("errors.loadStages")}
        onRetry={() => void query.refetch()}
        retryLabel={tCommon("retry")}
      />
    );
  }

  const stages = query.data.results;
  const nextOrder =
    stages.reduce((max, stage) => Math.max(max, stage.order), 0) + 1;

  async function onDelete(stage: ProjectStage) {
    setActionError(null);
    try {
      await removeStage.mutateAsync(stage.id);
    } catch (error) {
      if (isApiError(error) && error.status === 403) {
        setActionError(t("errors.forbidden"));
        return;
      }
      setActionError(t("errors.saveFailed"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
            {t("stagesTitle")}
          </h3>
          <p className="text-sm text-[var(--muted)]">{t("stagesHint")}</p>
        </div>
        {canManage ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setEditing(null);
              setShowCreate((open) => !open);
            }}
          >
            <Plus className="h-4 w-4" />
            {showCreate ? t("actions.cancel") : t("actions.addStage")}
          </Button>
        ) : null}
      </div>

      {actionError ? <Alert tone="danger">{actionError}</Alert> : null}

      {showCreate && canManage ? (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <StageForm
            projectId={projectId}
            defaultOrder={nextOrder}
            onCancel={() => setShowCreate(false)}
            onSuccess={() => setShowCreate(false)}
          />
        </div>
      ) : null}

      {editing && canManage ? (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <StageForm
            projectId={projectId}
            stage={editing}
            onCancel={() => setEditing(null)}
            onSuccess={() => setEditing(null)}
          />
        </div>
      ) : null}

      {stages.length === 0 ? (
        <EmptyState
          title={t("stagesEmptyTitle")}
          description={t("stagesEmptyDescription")}
          className="py-8"
        />
      ) : (
        <ol className="space-y-3">
          {stages.map((stage) => {
            const name =
              locale === "ar" && stage.name_ar ? stage.name_ar : stage.name;
            return (
              <li
                key={stage.id}
                className="rounded-lg border border-[var(--line)] bg-[var(--surface-elevated)] px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                        #{stage.order}
                      </span>
                      <p className="font-medium text-[var(--ink)]">{name}</p>
                      <StageStatusBadge status={stage.status} />
                    </div>
                    {stage.description ? (
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {stage.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-[var(--ink-soft)]">
                      {[stage.start_date, stage.completion_date]
                        .filter(Boolean)
                        .join(" → ") || t("noDates")}
                    </p>
                  </div>
                  {canManage ? (
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowCreate(false);
                          setEditing(stage);
                        }}
                        aria-label={t("actions.edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void onDelete(stage)}
                        aria-label={t("actions.delete")}
                      >
                        <Trash2 className="h-4 w-4 text-[var(--danger)]" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
