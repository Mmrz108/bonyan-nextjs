"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: AppLocale) {
    router.replace(pathname, { locale: next });
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface-elevated)] p-1",
        className,
      )}
      role="group"
      aria-label={t("language")}
    >
      {routing.locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => switchLocale(code)}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition-colors",
              active
                ? "bg-[var(--brand)] text-[var(--brand-contrast)]"
                : "text-[var(--muted)] hover:text-[var(--ink)]",
            )}
            aria-pressed={active}
          >
            {code === "en" ? t("english") : t("arabic")}
          </button>
        );
      })}
    </div>
  );
}
