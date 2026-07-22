"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { isApiError } from "@/lib/api/client";
import type {
  ChecklistResultValue,
  InspectionChecklist,
} from "@/lib/api/types";
import {
  useChecklistTemplatesQuery,
  useSiteVisitMutations,
  useVisitChecklistsQuery,
} from "@/hooks/use-site-visits";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { enqueueOfflineAction } from "@/lib/site-visits/offline-queue";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, PageLoader } from "@/components/ui/states";
import { CHECKLIST_RESULTS } from "@/lib/validations/site-visits";

type VisitChecklistPanelProps = {
  visitId: string;
  canPerform: boolean;
};

type DraftAnswer = {
  result: ChecklistResultValue | "";
  notes: string;
};

export function VisitChecklistPanel({
  visitId,
  canPerform,
}: VisitChecklistPanelProps) {
  const t = useTranslations("siteVisits");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const online = useOnlineStatus();
  const checklists = useVisitChecklistsQuery(visitId);
  const templates = useChecklistTemplatesQuery(canPerform);
  const { attachChecklist, saveResults, submitResults } =
    useSiteVisitMutations(visitId);
  const [templateId, setTemplateId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, DraftAnswer>>>(
    {},
  );

  const active = checklists.data?.results[0] as InspectionChecklist | undefined;

  useEffect(() => {
    if (!active) return;
    setDrafts((prev) => {
      if (prev[active.id]) return prev;
      const next: Record<string, DraftAnswer> = {};
      for (const item of active.items) {
        const existing = active.results.find((result) => result.item === item.id);
        next[item.id] = {
          result: existing?.result ?? "",
          notes: existing?.notes ?? "",
        };
      }
      return { ...prev, [active.id]: next };
    });
  }, [active]);

  const answers = useMemo(
    () => (active ? drafts[active.id] ?? {} : {}),
    [active, drafts],
  );

  const mandatoryMissing = useMemo(() => {
    if (!active) return 0;
    return active.items.filter((item) => {
      if (!item.is_mandatory) return false;
      return !answers[item.id]?.result;
    }).length;
  }, [active, answers]);

  async function onAttach() {
    if (!templateId) return;
    setError(null);
    try {
      await attachChecklist.mutateAsync({ id: visitId, templateId });
      setTemplateId("");
    } catch (err) {
      setError(
        isApiError(err) && err.status === 403
          ? t("errors.forbidden")
          : t("errors.saveFailed"),
      );
    }
  }

  async function onSave(submit: boolean) {
    if (!active) return;
    setError(null);
    const results = active.items
      .filter((item) => answers[item.id]?.result)
      .map((item) => ({
        item: item.id,
        result: answers[item.id].result as ChecklistResultValue,
        notes: answers[item.id].notes || "",
      }));

    if (!online) {
      enqueueOfflineAction({
        kind: "checklist_results",
        label: active.title,
        payload: { visitId, checklistId: active.id, results, submit },
      });
      setError(t("offline.queuedAction"));
      return;
    }

    try {
      await saveResults.mutateAsync({
        checklistId: active.id,
        results,
        visitId,
      });
      if (submit) {
        await submitResults.mutateAsync({
          checklistId: active.id,
          visitId,
        });
      }
    } catch (err) {
      setError(
        isApiError(err) ? err.message || t("errors.saveFailed") : t("errors.saveFailed"),
      );
    }
  }

  if (checklists.isPending) return <PageLoader label={tCommon("loading")} />;
  if (checklists.isError) {
    return (
      <ErrorState
        title={t("errors.loadChecklists")}
        onRetry={() => void checklists.refetch()}
        retryLabel={tCommon("retry")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
          {t("checklist.title")}
        </h3>
        <p className="text-sm text-[var(--muted)]">{t("checklist.hint")}</p>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {!active && canPerform ? (
        <div className="space-y-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
          <Select
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
          >
            <option value="">{t("checklist.chooseTemplate")}</option>
            {(templates.data?.results ?? []).map((template) => (
              <option key={template.id} value={template.id}>
                {locale === "ar" && template.title_ar
                  ? template.title_ar
                  : template.title}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            className="w-full"
            disabled={!templateId}
            loading={attachChecklist.isPending}
            onClick={() => void onAttach()}
          >
            {t("checklist.attach")}
          </Button>
        </div>
      ) : null}

      {!active ? (
        <EmptyState
          title={t("checklist.emptyTitle")}
          description={t("checklist.emptyDescription")}
          className="py-8"
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-[var(--ink)]">
              {locale === "ar" && active.title_ar ? active.title_ar : active.title}
            </p>
            <Badge tone={active.status === "completed" ? "success" : "brand"}>
              {t(`checklistStatus.${active.status}`)}
            </Badge>
          </div>

          <ul className="space-y-3">
            {active.items.map((item) => {
              const prompt =
                locale === "ar" && item.prompt_ar ? item.prompt_ar : item.prompt;
              const draft = answers[item.id] ?? { result: "", notes: "" };
              const locked = active.status === "completed" || !canPerform;
              return (
                <li
                  key={item.id}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {item.order}. {prompt}
                      {item.is_mandatory ? (
                        <span className="ms-1 text-[var(--danger)]">*</span>
                      ) : null}
                    </p>
                  </div>
                  {item.help_text ? (
                    <p className="mt-1 text-xs text-[var(--muted)]">{item.help_text}</p>
                  ) : null}
                  <div className="mt-3 grid gap-2">
                    <Select
                      disabled={locked}
                      value={draft.result}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [active.id]: {
                            ...prev[active.id],
                            [item.id]: {
                              ...draft,
                              result: event.target.value as ChecklistResultValue | "",
                            },
                          },
                        }))
                      }
                    >
                      <option value="">{t("checklist.chooseResult")}</option>
                      {CHECKLIST_RESULTS.map((result) => (
                        <option key={result} value={result}>
                          {t(`checklistResult.${result}`)}
                        </option>
                      ))}
                    </Select>
                    <textarea
                      disabled={locked}
                      value={draft.notes}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [active.id]: {
                            ...prev[active.id],
                            [item.id]: {
                              ...draft,
                              notes: event.target.value,
                            },
                          },
                        }))
                      }
                      placeholder={t("checklist.notesPlaceholder")}
                      className="min-h-16 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm disabled:opacity-60"
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {canPerform && active.status !== "completed" ? (
            <div className="sticky bottom-20 z-20 grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)]/95 p-3 backdrop-blur sm:static sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                loading={saveResults.isPending}
                onClick={() => void onSave(false)}
              >
                {t("checklist.saveDraft")}
              </Button>
              <Button
                type="button"
                loading={submitResults.isPending}
                disabled={mandatoryMissing > 0}
                onClick={() => void onSave(true)}
              >
                {mandatoryMissing > 0
                  ? t("checklist.mandatoryLeft", { count: mandatoryMissing })
                  : t("checklist.submit")}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
