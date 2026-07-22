import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type NotFoundProps = {
  params: Promise<{ locale: string }>;
};

export default async function NotFound({ params }: NotFoundProps) {
  await params;
  const t = await getTranslations("errors");
  const tNav = await getTranslations("nav");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
        {t("notFoundTitle")}
      </h1>
      <p className="max-w-md text-sm text-[var(--muted)]">{t("notFoundDescription")}</p>
      <Link href="/dashboard">
        <Button variant="secondary">{tNav("dashboard")}</Button>
      </Link>
    </div>
  );
}
