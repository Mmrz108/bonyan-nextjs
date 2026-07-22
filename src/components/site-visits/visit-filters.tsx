"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SITE_VISIT_STATUSES } from "@/lib/validations/site-visits";
import type { SiteVisitListParams, SiteVisitStatus } from "@/lib/api/types";

type VisitFiltersProps = {
  value: SiteVisitListParams;
  onChange: (next: SiteVisitListParams) => void;
};

export function VisitFilters({ value, onChange }: VisitFiltersProps) {
  const t = useTranslations("siteVisits");
  const [search, setSearch] = useState(value.search ?? "");

  useEffect(() => {
    setSearch(value.search ?? "");
  }, [value.search]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if ((value.search ?? "") !== search) {
        onChange({ ...value, search, page: 1 });
      }
    }, 300);
    return () => window.clearTimeout(handle);
  }, [search, onChange, value]);

  const hasFilters = Boolean(value.search) || Boolean(value.status);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-elevated)] p-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-0 flex-1">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          {t("filters.search")}
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("filters.searchPlaceholder")}
            className="ps-9"
          />
        </div>
      </div>
      <div className="w-full sm:w-44">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          {t("filters.status")}
        </label>
        <Select
          value={value.status ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              status: (event.target.value || "") as SiteVisitStatus | "",
              page: 1,
            })
          }
        >
          <option value="">{t("filters.all")}</option>
          {SITE_VISIT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`status.${status}`)}
            </option>
          ))}
        </Select>
      </div>
      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => {
            setSearch("");
            onChange({ page: 1, ordering: value.ordering });
          }}
        >
          <X className="h-4 w-4" />
          {t("filters.clear")}
        </Button>
      ) : null}
    </div>
  );
}
