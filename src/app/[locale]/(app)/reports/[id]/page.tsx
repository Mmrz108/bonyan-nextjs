import { getTranslations, setRequestLocale } from "next-intl/server";
import { ReportDetailView } from "@/components/reports/report-detail-view";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reports" });
  return { title: t("detailTitle") };
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <ReportDetailView reportId={id} />;
}
