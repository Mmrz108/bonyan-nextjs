"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { PdfStatus, ReportStatus } from "@/lib/api/types";

const reportTones: Record<
  ReportStatus,
  "neutral" | "brand" | "accent" | "success" | "warning" | "danger"
> = {
  draft: "neutral",
  submitted: "accent",
  under_review: "brand",
  approved: "success",
  rejected: "danger",
  sent: "success",
};

const pdfTones: Record<
  PdfStatus,
  "neutral" | "brand" | "accent" | "success" | "warning" | "danger"
> = {
  none: "neutral",
  queued: "accent",
  generating: "brand",
  ready: "success",
  failed: "danger",
};

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const t = useTranslations("reports");
  return <Badge tone={reportTones[status]}>{t(`status.${status}`)}</Badge>;
}

export function PdfStatusBadge({ status }: { status: PdfStatus }) {
  const t = useTranslations("reports");
  return <Badge tone={pdfTones[status]}>{t(`pdfStatus.${status}`)}</Badge>;
}
