"use client";

import { useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "@/i18n/navigation";
import { PageLoader } from "@/components/ui/states";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();
  const t = useTranslations("common");

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isReady, router]);

  if (!isReady || !isAuthenticated) {
    return <PageLoader label={t("loading")} />;
  }

  return children;
}

export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();
  const t = useTranslations("common");

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isReady, router]);

  if (!isReady || isAuthenticated) {
    return <PageLoader label={t("loading")} />;
  }

  return children;
}
