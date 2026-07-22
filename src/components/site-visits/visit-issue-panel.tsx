"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  createIssueSchema,
  ISSUE_SEVERITIES,
  type IssueFormValues,
} from "@/lib/validations/site-visits";
import { isApiError } from "@/lib/api/client";
import {
  useSiteVisitMutations,
  useVisitIssuesQuery,
} from "@/hooks/use-site-visits";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { enqueueOfflineAction } from "@/lib/site-visits/offline-queue";
import type { GeoCoordinates } from "@/lib/site-visits/geo";
import { CameraCapture } from "@/components/site-visits/camera-capture";
import { GpsCapture } from "@/components/site-visits/gps-capture";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, PageLoader } from "@/components/ui/states";

type VisitIssuePanelProps = {
  visitId: string;
  canPerform: boolean;
};

export function VisitIssuePanel({ visitId, canPerform }: VisitIssuePanelProps) {
  const t = useTranslations("siteVisits");
  const tCommon = useTranslations("common");
  const online = useOnlineStatus();
  const issues = useVisitIssuesQuery(visitId);
  const { createVisitIssue } = useSiteVisitMutations(visitId);
  const [showForm, setShowForm] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [coords, setCoords] = useState<GeoCoordinates | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const schema = createIssueSchema({
    titleRequired: t("validation.titleRequired"),
    dateInvalid: t("validation.dateInvalid"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IssueFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      title: "",
      description: "",
      severity: "medium",
      due_date: "",
      caption: "",
    },
  });

  async function onSubmit(values: IssueFormValues) {
    setFormError(null);

    if (!online) {
      enqueueOfflineAction({
        kind: "issue_photo",
        label: values.title,
        payload: {
          visitId,
          title: values.title,
          description: values.description,
          severity: values.severity,
          due_date: values.due_date,
          hasPhoto: Boolean(photo),
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        },
      });
      setFormError(t("offline.queuedAction"));
      return;
    }

    try {
      await createVisitIssue.mutateAsync({
        payload: {
          site_visit: visitId,
          title: values.title,
          description: values.description || "",
          severity: values.severity,
          due_date: values.due_date,
        },
        photo: photo
          ? {
              file: photo,
              caption: values.caption || values.title,
              latitude: coords?.latitude,
              longitude: coords?.longitude,
              client_generated_id: crypto.randomUUID(),
            }
          : undefined,
      });
      reset();
      setPhoto(null);
      setCoords(null);
      setShowForm(false);
    } catch (error) {
      setFormError(
        isApiError(error)
          ? error.status === 403
            ? t("errors.forbidden")
            : error.message
          : t("errors.saveFailed"),
      );
    }
  }

  if (issues.isPending) return <PageLoader label={tCommon("loading")} />;
  if (issues.isError) {
    return (
      <ErrorState
        title={t("errors.loadIssues")}
        onRetry={() => void issues.refetch()}
        retryLabel={tCommon("retry")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
            {t("issues.title")}
          </h3>
          <p className="text-sm text-[var(--muted)]">{t("issues.hint")}</p>
        </div>
        {canPerform ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setShowForm((open) => !open)}
          >
            {showForm ? t("actions.cancel") : t("issues.create")}
          </Button>
        ) : null}
      </div>

      {showForm && canPerform ? (
        <form
          className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          {formError ? <Alert tone="danger">{formError}</Alert> : null}
          <div>
            <Label>{t("fields.issueTitle")}</Label>
            <Input invalid={Boolean(errors.title)} {...register("title")} />
          </div>
          <div>
            <Label>{t("fields.severity")}</Label>
            <Select {...register("severity")}>
              {ISSUE_SEVERITIES.map((severity) => (
                <option key={severity} value={severity}>
                  {t(`severity.${severity}`)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>{t("fields.description")}</Label>
            <textarea
              className="min-h-20 w-full rounded-md border border-[var(--line)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
              {...register("description")}
            />
          </div>
          <div>
            <Label>{t("fields.dueDate")}</Label>
            <Input type="date" {...register("due_date")} />
          </div>
          <GpsCapture value={coords} onChange={setCoords} />
          <div>
            <Label>{t("fields.photo")}</Label>
            <CameraCapture file={photo} onChange={setPhoto} />
          </div>
          <div>
            <Label>{t("fields.caption")}</Label>
            <Input {...register("caption")} />
          </div>
          <Button type="submit" className="w-full" loading={isSubmitting}>
            {t("issues.submit")}
          </Button>
        </form>
      ) : null}

      {issues.data.results.length === 0 ? (
        <EmptyState
          title={t("issues.emptyTitle")}
          description={t("issues.emptyDescription")}
          className="py-8"
        />
      ) : (
        <ul className="space-y-2">
          {issues.data.results.map((issue) => (
            <li
              key={issue.id}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-[var(--ink)]">{issue.title}</p>
                <Badge
                  tone={
                    issue.severity === "critical" || issue.severity === "high"
                      ? "danger"
                      : "warning"
                  }
                >
                  {t(`severity.${issue.severity}`)}
                </Badge>
              </div>
              {issue.description ? (
                <p className="mt-1 text-sm text-[var(--muted)]">{issue.description}</p>
              ) : null}
              <p className="mt-2 text-xs text-[var(--ink-soft)]">
                {t(`issueStatus.${issue.status}`)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
