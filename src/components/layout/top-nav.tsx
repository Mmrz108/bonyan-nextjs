"use client";

import { useTranslations } from "next-intl";
import { Bell, LogOut, Menu, Search } from "lucide-react";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { displayRoleLabel } from "@/lib/auth/roles";

type TopNavProps = {
  onMenuClick: () => void;
};

export function TopNav({ onMenuClick }: TopNavProps) {
  const t = useTranslations("topbar");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await logout();
    router.replace("/login");
  }

  const primaryRole = user?.roles[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--line)] bg-[var(--surface-elevated)]/90 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        className="rounded-md p-2 text-[var(--ink-soft)] hover:bg-[var(--surface-muted)] lg:hidden"
        onClick={onMenuClick}
        aria-label={tNav("openMenu")}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--ink)]">{t("workspace")}</p>
        <p className="hidden truncate text-xs text-[var(--muted)] sm:block">
          {tCommon("tagline")}
        </p>
      </div>

      <div className="hidden max-w-xs flex-1 md:block lg:max-w-sm">
        <label className="relative block">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="search"
            disabled
            placeholder={tCommon("search")}
            className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] pe-3 ps-9 text-sm text-[var(--muted)]"
          />
        </label>
      </div>

      <LocaleSwitcher className="hidden sm:inline-flex" />

      <button
        type="button"
        className="rounded-md p-2 text-[var(--ink-soft)] hover:bg-[var(--surface-muted)]"
        aria-label={t("notifications")}
      >
        <Bell className="h-5 w-5" />
      </button>

      <div className="hidden items-center gap-2 border-s border-[var(--line)] ps-3 sm:flex">
        <div className="text-end">
          <p className="text-sm font-medium text-[var(--ink)]">
            {user?.full_name || t("profile")}
          </p>
          <p className="max-w-[12rem] truncate text-xs text-[var(--muted)]">
            {primaryRole ? displayRoleLabel(primaryRole) : user?.email}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          aria-label={tNav("signOut")}
          className="px-2"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
