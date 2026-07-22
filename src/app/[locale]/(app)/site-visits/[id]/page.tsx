import { getTranslations, setRequestLocale } from "next-intl/server";
import { VisitDetailView } from "@/components/site-visits/visit-detail-view";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "siteVisits" });
  return { title: t("detailTitle") };
}

export default async function SiteVisitDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <VisitDetailView visitId={id} />;
}
