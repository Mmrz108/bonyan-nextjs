import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RedirectIfAuthenticated } from "@/components/auth/auth-guards";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { Link } from "@/i18n/navigation";

type AuthLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AuthLayout({ children, params }: AuthLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("common");

  return (
    <RedirectIfAuthenticated>
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -start-24 top-0 h-72 w-72 rounded-full bg-[var(--brand)]/10 blur-3xl" />
          <div className="absolute -end-16 bottom-10 h-80 w-80 rounded-full bg-[var(--accent)]/15 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <Link href="/login" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--brand)] font-[family-name:var(--font-display)] text-base font-bold text-[var(--brand-contrast)]">
                B
              </span>
              <span>
                <span className="block font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
                  {t("appName")}
                </span>
                <span className="block text-xs text-[var(--muted)]">{t("tagline")}</span>
              </span>
            </Link>
            <LocaleSwitcher />
          </header>

          <div className="flex flex-1 items-center justify-center py-10">
            <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="hidden lg:block">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                  {t("appName")}
                </p>
                <h1 className="mt-4 max-w-xl font-[family-name:var(--font-display)] text-4xl leading-tight text-[var(--ink)] xl:text-5xl">
                  {t("tagline")}
                </h1>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--muted)]">
                  Plan site supervision, capture field evidence, and deliver
                  client-ready reports from one bilingual workspace.
                </p>
              </section>
              <section>{children}</section>
            </div>
          </div>
        </div>
      </div>
    </RedirectIfAuthenticated>
  );
}
