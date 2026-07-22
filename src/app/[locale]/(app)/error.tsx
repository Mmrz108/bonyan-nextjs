"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/ui/states";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="space-y-4 py-8">
      <ErrorState
        title={t("title")}
        description={t("description")}
        onRetry={reset}
        retryLabel={tCommon("retry")}
      />
      <div className="flex justify-center">
        <Link href="/dashboard">
          <Button variant="secondary">{tNav("dashboard")}</Button>
        </Link>
      </div>
    </div>
  );
}
