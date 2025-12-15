import ProjectCard from "@/app/_components/projects/project-card";
import UploadImageCard from "@/app/_components/projects/upload-image-card";
import IntegrationApi from "@/app/_components/settings/integration-api";
import IntegrationHeadwork from "@/app/_components/settings/integration-headwork";
import { fetchProject } from "@/services/projects";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { CanRead } from "@/lib/components/permission-gates";
import { getAbacPermissions, getProjectPermissions, canWrite } from "@/lib/abac";

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

  const permissions = await getAbacPermissions();
  const projectPermissions = getProjectPermissions(permissions, project.id);
  const readOnly = !canWrite(projectPermissions, "settings.integration");

  return (
    <>
      <CanRead projectId={project.id} resource="settings.integration" fallback={t('noAccess', { settings: t('integrations') })}>
        <IntegrationApi projectId={project.id} readOnly={readOnly} />
        <IntegrationHeadwork projectId={project.id} useHeadwork={project.useHeadwork} readOnly={readOnly} />
      </CanRead>
    </>
  );
}
