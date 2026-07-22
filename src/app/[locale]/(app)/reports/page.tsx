import { getTranslations, setRequestLocale } from "next-intl/server";
import { ReportListView } from "@/components/reports/report-list-view";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reports" });
  return { title: t("title") };
}

export default async function ReportsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ReportListView />;
}
