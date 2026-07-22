import { getTranslations, setRequestLocale } from "next-intl/server";
import { VisitListView } from "@/components/site-visits/visit-list-view";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "siteVisits" });
  return { title: t("title") };
}

export default async function SiteVisitsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <VisitListView />;
}
