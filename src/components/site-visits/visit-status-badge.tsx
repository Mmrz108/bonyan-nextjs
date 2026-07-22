"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { SiteVisitStatus } from "@/lib/api/types";

const tones: Record<
  SiteVisitStatus,
  "neutral" | "brand" | "accent" | "success" | "warning" | "danger"
> = {
  scheduled: "accent",
  in_progress: "brand",
  completed: "success",
  cancelled: "danger",
};

export function VisitStatusBadge({ status }: { status: SiteVisitStatus }) {
  const t = useTranslations("siteVisits");
  return <Badge tone={tones[status]}>{t(`status.${status}`)}</Badge>;
}
