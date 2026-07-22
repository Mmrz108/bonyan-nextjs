"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import {
  createMemberSchema,
  MEMBER_ROLES,
  type MemberFormValues,
} from "@/lib/validations/projects";
import type { Project, ProjectMember } from "@/lib/api/types";
import { isApiError } from "@/lib/api/client";
import { useProjectMutations } from "@/hooks/use-projects";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/states";

type ProjectMembersPanelProps = {
  project: Project;
  canManage: boolean;
};

export function ProjectMembersPanel({
  project,
  canManage,
}: ProjectMembersPanelProps) {
  const t = useTranslations("projects");
  const { update } = useProjectMutations(project.id);
  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const schema = createMemberSchema({
    userRequired: t("validation.userRequired"),
    userInvalid: t("validation.userInvalid"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      user: "",
      member_role: "viewer",
      is_active: true,
    },
  });

  async function replaceMembers(next: Array<{
    user: string;
    member_role: ProjectMember["member_role"];
    is_active: boolean;
  }>) {
    setFormError(null);
    try {
      await update.mutateAsync({
        id: project.id,
        payload: { members: next },
      });
      reset();
      setShowForm(false);
    } catch (error) {
      if (isApiError(error) && error.status === 403) {
        setFormError(t("errors.forbidden"));
        return;
      }
      setFormError(t("errors.saveFailed"));
    }
  }

  async function onAdd(values: MemberFormValues) {
    const next = [
      ...project.members.map((member) => ({
        user: member.user,
        member_role: member.member_role,
        is_active: member.is_active,
      })),
      {
        user: values.user,
        member_role: values.member_role,
        is_active: values.is_active,
      },
    ];
    await replaceMembers(next);
  }

  async function onRemove(member: ProjectMember) {
    const next = project.members
      .filter((item) => item.id !== member.id)
      .map((item) => ({
        user: item.user,
        member_role: item.member_role,
        is_active: item.is_active,
      }));
    await replaceMembers(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
            {t("membersTitle")}
          </h3>
          <p className="text-sm text-[var(--muted)]">{t("membersHint")}</p>
        </div>
        {canManage ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowForm((open) => !open)}
          >
            {showForm ? t("actions.cancel") : t("actions.addMember")}
          </Button>
        ) : null}
      </div>

      {formError ? <Alert tone="danger">{formError}</Alert> : null}

      {showForm && canManage ? (
        <form
          className="grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 sm:grid-cols-[1fr_12rem_auto]"
          onSubmit={handleSubmit(onAdd)}
          noValidate
        >
          <div>
            <Label>{t("fields.userId")}</Label>
            <Input
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              invalid={Boolean(errors.user)}
              {...register("user")}
            />
            {errors.user ? (
              <p className="mt-1 text-xs text-[var(--danger)]">
                {errors.user.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-[var(--muted)]">
                {t("fields.userIdHint")}
              </p>
            )}
          </div>
          <div>
            <Label>{t("fields.memberRole")}</Label>
            <Select {...register("member_role")}>
              {MEMBER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {t(`memberRole.${role}`)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
              {t("actions.addMember")}
            </Button>
          </div>
        </form>
      ) : null}

      {project.members.length === 0 ? (
        <EmptyState
          title={t("membersEmptyTitle")}
          description={t("membersEmptyDescription")}
          className="py-8"
        />
      ) : (
        <ul className="divide-y divide-[var(--line)] rounded-lg border border-[var(--line)] bg-[var(--surface-elevated)]">
          {project.members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--ink)]">
                  {member.user_email || member.user}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{t(`memberRole.${member.member_role}`)}</Badge>
                  {!member.is_active ? (
                    <Badge tone="neutral">{t("inactive")}</Badge>
                  ) : null}
                </div>
              </div>
              {canManage ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={t("actions.removeMember")}
                  onClick={() => void onRemove(member)}
                  disabled={update.isPending}
                >
                  <Trash2 className="h-4 w-4 text-[var(--danger)]" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
