"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  createReportSchema,
  type ReportFormValues,
} from "@/lib/validations/reports";
import { isApiError } from "@/lib/api/client";
import type { Report } from "@/lib/api/types";
import {
  useCompletedVisitsForReportsQuery,
  useReportMutations,
} from "@/hooks/use-reports";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type ReportCreateFormProps = {
  onSuccess?: (report: Report) => void;
  onCancel?: () => void;
};

export function ReportCreateForm({
  onSuccess,
  onCancel,
}: ReportCreateFormProps) {
  const t = useTranslations("reports");
  const visits = useCompletedVisitsForReportsQuery(true);
  const { create } = useReportMutations();
  const [formError, setFormError] = useState<string | null>(null);

  const schema = createReportSchema({
    visitRequired: t("validation.visitRequired"),
    titleRequired: t("validation.titleRequired"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      site_visit: "",
      title: "",
      summary: "",
    },
  });

  async function onSubmit(values: ReportFormValues) {
    setFormError(null);
    try {
      const report = await create.mutateAsync({
        site_visit: values.site_visit,
        title: values.title,
        summary: values.summary || "",
      });
      onSuccess?.(report);
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

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      <div>
        <Label>{t("fields.siteVisit")}</Label>
        <Select invalid={Boolean(errors.site_visit)} {...register("site_visit")}>
          <option value="">{t("fields.siteVisitPlaceholder")}</option>
          {(visits.data?.results ?? []).map((visit) => (
            <option key={visit.id} value={visit.id}>
              {visit.title} — {visit.project_name}
            </option>
          ))}
        </Select>
        {errors.site_visit ? (
          <p className="mt-1 text-xs text-[var(--danger)]">
            {errors.site_visit.message}
          </p>
        ) : null}
      </div>
      <div>
        <Label>{t("fields.title")}</Label>
        <Input invalid={Boolean(errors.title)} {...register("title")} />
      </div>
      <div>
        <Label>{t("fields.summary")}</Label>
        <textarea
          className="min-h-24 w-full rounded-md border border-[var(--line)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
          {...register("summary")}
        />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("actions.cancel")}
          </Button>
        ) : null}
        <Button type="submit" loading={isSubmitting}>
          {t("actions.createDraft")}
        </Button>
      </div>
    </form>
  );
}
