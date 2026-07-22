import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProjectDetailView } from "@/components/projects/project-detail-view";

type ProjectDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "projects" });
  return { title: t("detailTitle") };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <ProjectDetailView projectId={id} />;
}
