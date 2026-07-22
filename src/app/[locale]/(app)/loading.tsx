"use client";

import { useTranslations } from "next-intl";
import { PageLoader } from "@/components/ui/states";

export default function AppLoading() {
  const t = useTranslations("common");
  return <PageLoader label={t("loading")} />;
}
