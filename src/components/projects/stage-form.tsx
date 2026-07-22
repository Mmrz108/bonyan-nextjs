"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  createStageSchema,
  STAGE_STATUSES,
  type StageFormValues,
} from "@/lib/validations/projects";
import type { ProjectStage } from "@/lib/api/types";
import { isApiError } from "@/lib/api/client";
import { useProjectMutations } from "@/hooks/use-projects";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type StageFormProps = {
  projectId: string;
  stage?: ProjectStage;
  defaultOrder?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function StageForm({
  projectId,
  stage,
  defaultOrder = 1,
  onSuccess,
  onCancel,
}: StageFormProps) {
  const t = useTranslations("projects");
  const { createStage, updateStage } = useProjectMutations(projectId);
  const [formError, setFormError] = useState<string | null>(null);

  const schema = createStageSchema({
    nameRequired: t("validation.nameRequired"),
    orderRequired: t("validation.orderRequired"),
    dateInvalid: t("validation.dateInvalid"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StageFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: stage?.name ?? "",
      name_ar: stage?.name_ar ?? "",
      description: stage?.description ?? "",
      order: stage?.order ?? defaultOrder,
      status: stage?.status ?? "not_started",
      start_date: stage?.start_date ?? "",
      completion_date: stage?.completion_date ?? "",
    },
  });

  async function onSubmit(values: StageFormValues) {
    setFormError(null);
    const payload = {
      name: values.name,
      name_ar: values.name_ar || "",
      description: values.description || "",
      order: values.order,
      status: values.status,
      start_date: values.start_date,
      completion_date: values.completion_date,
    };
    try {
      if (stage) {
        await updateStage.mutateAsync({ stageId: stage.id, payload });
      } else {
        await createStage.mutateAsync(payload);
      }
      onSuccess?.();
    } catch (error) {
      if (isApiError(error) && error.status === 403) {
        setFormError(t("errors.forbidden"));
        return;
      }
      setFormError(t("errors.saveFailed"));
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>{t("fields.name")}</Label>
          <Input invalid={Boolean(errors.name)} {...register("name")} />
        </div>
        <div>
          <Label>{t("fields.order")}</Label>
          <Input
            type="number"
            min={1}
            invalid={Boolean(errors.order)}
            {...register("order")}
          />
        </div>
        <div>
          <Label>{t("fields.status")}</Label>
          <Select {...register("status")}>
            {STAGE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`stageStatus.${status}`)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t("fields.nameAr")}</Label>
          <Input {...register("name_ar")} dir="rtl" />
        </div>
        <div>
          <Label>{t("fields.startDate")}</Label>
          <Input type="date" {...register("start_date")} />
        </div>
        <div>
          <Label>{t("fields.completionDate")}</Label>
          <Input type="date" {...register("completion_date")} />
        </div>
        <div className="sm:col-span-2">
          <Label>{t("fields.description")}</Label>
          <textarea
            className="min-h-20 w-full rounded-md border border-[var(--line)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
            {...register("description")}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("actions.cancel")}
          </Button>
        ) : null}
        <Button type="submit" loading={isSubmitting}>
          {stage ? t("actions.save") : t("actions.addStage")}
        </Button>
      </div>
    </form>
  );
}
