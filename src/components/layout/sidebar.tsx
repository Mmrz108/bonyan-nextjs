"use client";

import { useTranslations } from "next-intl";
import {
  ClipboardList,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MapPinned,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { getNavItemsForRoles } from "@/lib/auth/navigation";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  projects: FolderKanban,
  siteVisits: MapPinned,
  issues: ClipboardList,
  reports: FileText,
  settings: Settings,
};

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const { user } = useAuth();
  const items = getNavItemsForRoles(user?.roles);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-[var(--ink)]/40 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex w-[17.5rem] flex-col border-[var(--line)] bg-[var(--surface-elevated)] transition-transform duration-200",
          "start-0 border-e",
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
          "lg:static lg:translate-x-0 lg:rtl:translate-x-0",
        )}
        aria-label={t("mainNavigation")}
      >
        <div className="flex h-16 items-center justify-between gap-3 border-b border-[var(--line)] px-5">
          <Link href="/dashboard" className="group flex min-w-0 items-center gap-3" onClick={onClose}>
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--brand)] font-[family-name:var(--font-display)] text-sm font-bold text-[var(--brand-contrast)]">
              B
            </span>
            <span className="min-w-0">
              <span className="block truncate font-[family-name:var(--font-display)] text-base font-semibold text-[var(--ink)]">
                {tCommon("appName")}
              </span>
              <span className="block truncate text-xs text-[var(--muted)]">
                {tCommon("tagline")}
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="rounded-md p-2 text-[var(--muted)] hover:bg-[var(--surface-muted)] lg:hidden"
            onClick={onClose}
            aria-label={t("closeMenu")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const Icon = ICONS[item.key] ?? LayoutDashboard;
            const active =
              item.implemented &&
              (pathname === item.href || pathname.startsWith(`${item.href}/`));

            if (!item.implemented) {
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm text-[var(--muted)]"
                  aria-disabled
                >
                  <span className="inline-flex items-center gap-3">
                    <Icon className="h-4 w-4 opacity-70" aria-hidden />
                    {t(item.key)}
                  </span>
                  <span className="rounded border border-[var(--line)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                    {tCommon("comingSoon")}
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--brand-tint)] text-[var(--brand-strong)]"
                    : "text-[var(--ink-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--line)] px-4 py-4 text-xs text-[var(--muted)]">
          <p className="font-medium text-[var(--ink-soft)]">{tCommon("appName")}</p>
          <p className="mt-1 leading-relaxed">{tCommon("tagline")}</p>
        </div>
      </aside>
    </>
  );
}
