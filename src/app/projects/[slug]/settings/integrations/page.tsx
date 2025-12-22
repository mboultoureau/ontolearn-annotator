import ProjectCard from "@/app/_components/projects/project-card";
import UploadImageCard from "@/app/_components/projects/upload-image-card";
import IntegrationApi from "@/app/_components/settings/integration-api";
import IntegrationHeadwork from "@/app/_components/settings/integration-headwork";
import { fetchProject } from "@/services/projects";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { checkPermission } from "@/lib/abac-client";

type Props = {
  params: {
    slug: string;
  };
};

export default async function IntegrationsPage({ params }: Props) {
  const t = await getTranslations("Project.Settings");
  const project = await fetchProject({ slug: params.slug });

  if (!project) {
    notFound();
  }

  const canRead = await checkPermission(project.id, "settings:read");
  const canWriteSettings = await checkPermission(project.id, "settings:write");
  const readOnly = !canWriteSettings;

  if (!canRead) {
    return <div>{t('noAccess', { settings: t('integrations') })}</div>;
  }

  return (
    <>
      <IntegrationApi projectId={project.id} readOnly={readOnly} />
      <IntegrationHeadwork projectId={project.id} useHeadwork={project.useHeadwork} readOnly={readOnly} />
    </>
  );
}
