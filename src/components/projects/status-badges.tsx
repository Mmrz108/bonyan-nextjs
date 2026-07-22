"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { ProjectStatus, StageStatus } from "@/lib/api/types";

const projectTone: Record<
  ProjectStatus,
  "neutral" | "brand" | "accent" | "success" | "warning" | "danger"
> = {
  planning: "neutral",
  active: "success",
  on_hold: "warning",
  completed: "accent",
  cancelled: "danger",
};

const stageTone: Record<
  StageStatus,
  "neutral" | "brand" | "success"
> = {
  not_started: "neutral",
  in_progress: "brand",
  completed: "success",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const t = useTranslations("projects");
  return <Badge tone={projectTone[status]}>{t(`status.${status}`)}</Badge>;
}

export function StageStatusBadge({ status }: { status: StageStatus }) {
  const t = useTranslations("projects");
  return <Badge tone={stageTone[status]}>{t(`stageStatus.${status}`)}</Badge>;
}
