"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, MapPinned } from "lucide-react";
import type { SiteVisitListItem } from "@/lib/api/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/utils";

type VisitListProps = {
  title: string;
  description: string;
  visits: SiteVisitListItem[];
  emptyTitle: string;
  emptyDescription: string;
  variant?: "recent" | "upcoming";
};

function formatVisitDate(value: string, locale: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusTone(status: SiteVisitListItem["status"]) {
  switch (status) {
    case "completed":
      return "bg-[var(--success-tint)] text-[var(--success)]";
    case "in_progress":
      return "bg-[var(--brand-tint)] text-[var(--brand)]";
    case "scheduled":
      return "bg-[color-mix(in_srgb,var(--accent)_18%,white)] text-[color-mix(in_srgb,var(--accent)_85%,#5c3a0a)]";
    default:
      return "bg-[var(--surface-muted)] text-[var(--muted)]";
  }
}

export function SiteVisitsPanel({
  title,
  description,
  visits,
  emptyTitle,
  emptyDescription,
  variant = "recent",
}: VisitListProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {visits.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {visits.map((visit) => (
              <li
                key={visit.id}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                    variant === "upcoming"
                      ? "bg-[color-mix(in_srgb,var(--accent)_16%,white)] text-[var(--accent)]"
                      : "bg-[var(--brand-tint)] text-[var(--brand)]",
                  )}
                  aria-hidden
                >
                  {variant === "upcoming" ? (
                    <CalendarDays className="h-4 w-4" />
                  ) : (
                    <MapPinned className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-[var(--ink)]">
                      {visit.title || visit.project_name}
                    </p>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        statusTone(visit.status),
                      )}
                    >
                      {t(`visitStatus.${visit.status}`)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                    {visit.project_name}
                    {visit.stage_name ? ` · ${visit.stage_name}` : ""}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-[var(--ink-soft)]">
                    {visit.scheduled_date
                      ? formatVisitDate(visit.scheduled_date, locale)
                      : "—"}
                    {visit.assigned_to_email
                      ? ` · ${visit.assigned_to_email}`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
