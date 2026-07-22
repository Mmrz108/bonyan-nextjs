"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  createSiteVisitSchema,
  type SiteVisitFormValues,
} from "@/lib/validations/site-visits";
import { isApiError } from "@/lib/api/client";
import type { SiteVisit } from "@/lib/api/types";
import {
  useProjectsForVisitsQuery,
  useSiteVisitMutations,
} from "@/hooks/use-site-visits";
import { useAuth } from "@/components/providers/auth-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type VisitCreateFormProps = {
  onSuccess?: (visit: SiteVisit) => void;
  onCancel?: () => void;
};

export function VisitCreateForm({ onSuccess, onCancel }: VisitCreateFormProps) {
  const t = useTranslations("siteVisits");
  const { user } = useAuth();
  const projects = useProjectsForVisitsQuery(true);
  const { create } = useSiteVisitMutations();
  const [formError, setFormError] = useState<string | null>(null);

  const schema = createSiteVisitSchema({
    projectRequired: t("validation.projectRequired"),
    assigneeRequired: t("validation.assigneeRequired"),
    dateInvalid: t("validation.dateInvalid"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SiteVisitFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      project: "",
      project_stage: "",
      assigned_to: user?.id ?? "",
      title: "",
      scheduled_date: "",
      notes: "",
    },
  });

  async function onSubmit(values: SiteVisitFormValues) {
    setFormError(null);
    try {
      const visit = await create.mutateAsync({
        project: values.project,
        project_stage: values.project_stage,
        assigned_to: values.assigned_to || user!.id,
        title: values.title || undefined,
        scheduled_date: values.scheduled_date,
        notes: values.notes || "",
      });
      onSuccess?.(visit);
    } catch (error) {
      if (isApiError(error)) {
        setFormError(
          error.status === 403 ? t("errors.forbidden") : error.message,
        );
        return;
      }
      setFormError(t("errors.saveFailed"));
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
      {formError ? <Alert tone="danger">{formError}</Alert> : null}

      <div>
        <Label>{t("fields.project")}</Label>
        <Select invalid={Boolean(errors.project)} {...register("project")}>
          <option value="">{t("fields.projectPlaceholder")}</option>
          {(projects.data?.results ?? []).map((project) => (
            <option key={project.id} value={project.id}>
              {project.code} — {project.name}
            </option>
          ))}
        </Select>
        {errors.project ? (
          <p className="mt-1 text-xs text-[var(--danger)]">{errors.project.message}</p>
        ) : null}
      </div>

      <div>
        <Label>{t("fields.title")}</Label>
        <Input {...register("title")} placeholder={t("fields.titlePlaceholder")} />
      </div>

      <div>
        <Label>{t("fields.scheduledDate")}</Label>
        <Input type="date" {...register("scheduled_date")} />
      </div>

      <div>
        <Label>{t("fields.notes")}</Label>
        <textarea
          className="min-h-20 w-full rounded-md border border-[var(--line)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
          {...register("notes")}
        />
      </div>

      <input type="hidden" {...register("assigned_to")} />

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("actions.cancel")}
          </Button>
        ) : null}
        <Button type="submit" loading={isSubmitting} className="min-w-28">
          {t("actions.create")}
        </Button>
      </div>
    </form>
  );
}
