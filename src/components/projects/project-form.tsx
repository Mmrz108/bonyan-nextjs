"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  createProjectSchema,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  type ProjectFormValues,
} from "@/lib/validations/projects";
import type { Project } from "@/lib/api/types";
import { isApiError } from "@/lib/api/client";
import { useContractsQuery, useProjectMutations } from "@/hooks/use-projects";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type ProjectFormProps = {
  project?: Project;
  onSuccess?: (project: Project) => void;
  onCancel?: () => void;
};

export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const t = useTranslations("projects");
  const contracts = useContractsQuery(true);
  const { create, update } = useProjectMutations(project?.id);
  const [formError, setFormError] = useState<string | null>(null);

  const schema = createProjectSchema({
    codeRequired: t("validation.codeRequired"),
    nameRequired: t("validation.nameRequired"),
    contractRequired: t("validation.contractRequired"),
    dateInvalid: t("validation.dateInvalid"),
    coordInvalid: t("validation.coordInvalid"),
    coordPair: t("validation.coordPair"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      code: project?.code ?? "",
      name: project?.name ?? "",
      name_ar: project?.name_ar ?? "",
      description: project?.description ?? "",
      contract: project?.contract ?? "",
      status: project?.status ?? "planning",
      project_type: project?.project_type ?? "other",
      location: project?.location ?? "",
      address: project?.address ?? "",
      latitude: project?.latitude ?? "",
      longitude: project?.longitude ?? "",
      start_date: project?.start_date ?? "",
      expected_completion_date: project?.expected_completion_date ?? "",
    },
  });

  async function onSubmit(values: ProjectFormValues) {
    setFormError(null);
    const payload = {
      code: values.code,
      name: values.name,
      name_ar: values.name_ar || "",
      description: values.description || "",
      contract: values.contract,
      status: values.status,
      project_type: values.project_type,
      location: values.location || "",
      address: values.address || "",
      latitude: values.latitude,
      longitude: values.longitude,
      start_date: values.start_date,
      expected_completion_date: values.expected_completion_date,
    };

    try {
      const saved = project
        ? await update.mutateAsync({ id: project.id, payload })
        : await create.mutateAsync(payload);
      onSuccess?.(saved);
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 403) {
          setFormError(t("errors.forbidden"));
          return;
        }
        setFormError(error.message || t("errors.saveFailed"));
        return;
      }
      setFormError(t("errors.saveFailed"));
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {formError ? <Alert tone="danger">{formError}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("fields.code")} error={errors.code?.message}>
          <Input invalid={Boolean(errors.code)} {...register("code")} />
        </Field>
        <Field label={t("fields.contract")} error={errors.contract?.message}>
          <Select invalid={Boolean(errors.contract)} {...register("contract")}>
            <option value="">{t("fields.contractPlaceholder")}</option>
            {(contracts.data?.results ?? []).map((contract) => (
              <option key={contract.id} value={contract.id}>
                {contract.reference_code} — {contract.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("fields.name")} error={errors.name?.message} className="sm:col-span-2">
          <Input invalid={Boolean(errors.name)} {...register("name")} />
        </Field>
        <Field label={t("fields.nameAr")} className="sm:col-span-2">
          <Input {...register("name_ar")} dir="rtl" />
        </Field>
        <Field label={t("fields.status")} error={errors.status?.message}>
          <Select {...register("status")}>
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("fields.type")} error={errors.project_type?.message}>
          <Select {...register("project_type")}>
            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`type.${type}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("fields.location")}>
          <Input {...register("location")} />
        </Field>
        <Field label={t("fields.address")}>
          <Input {...register("address")} />
        </Field>
        <Field label={t("fields.latitude")} error={errors.latitude?.message}>
          <Input {...register("latitude")} placeholder="24.7136" />
        </Field>
        <Field label={t("fields.longitude")} error={errors.longitude?.message}>
          <Input {...register("longitude")} placeholder="46.6753" />
        </Field>
        <Field label={t("fields.startDate")} error={errors.start_date?.message}>
          <Input type="date" {...register("start_date")} />
        </Field>
        <Field
          label={t("fields.expectedCompletion")}
          error={errors.expected_completion_date?.message}
        >
          <Input type="date" {...register("expected_completion_date")} />
        </Field>
        <Field label={t("fields.description")} className="sm:col-span-2">
          <textarea
            className="min-h-24 w-full rounded-md border border-[var(--line)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            {...register("description")}
          />
        </Field>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("actions.cancel")}
          </Button>
        ) : null}
        <Button type="submit" loading={isSubmitting}>
          {project ? t("actions.save") : t("actions.create")}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
      {error ? <p className="mt-1 text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
