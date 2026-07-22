import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { RequireAuth } from "@/components/auth/auth-guards";
import { AppShell } from "@/components/layout/app-shell";

type AppLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AuthenticatedLayout({
  children,
  params,
}: AppLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
