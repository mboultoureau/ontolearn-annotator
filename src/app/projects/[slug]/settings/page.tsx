import ProjectCard from "@/app/_components/projects/project-card"
import UploadImageCard from "@/app/_components/projects/upload-image-card"
import { fetchProject } from "@/services/projects"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { CanRead } from "@/lib/components/permission-gates";
import { getAbacPermissions, getProjectPermissions, canWrite } from "@/lib/abac";

type Props = {
  params: {
    slug: string
  }
}

export default async function DashboardPage({ params }: Props) {
  const t = await getTranslations("Project.Settings")
  const project = await fetchProject({ slug: params.slug });

  if (!project) {
    notFound();
  }

  const permissions = await getAbacPermissions();
  const projectPermissions = getProjectPermissions(permissions, project.id);
  const readOnly = !canWrite(projectPermissions, "settings.general");

  return (
    <>
      <CanRead projectId={project.id} resource="settings.general" fallback={t('noAccess', { settings: t('general') })}>
        <ProjectCard project={project} readOnly={readOnly} />
        <UploadImageCard project={project} readOnly={readOnly} />
      </CanRead> 
    </>
  )
}
