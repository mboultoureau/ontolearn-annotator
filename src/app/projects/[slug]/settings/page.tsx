import ProjectCard from "@/app/_components/projects/project-card"
import UploadImageCard from "@/app/_components/projects/upload-image-card"
import { fetchProject } from "@/services/projects"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { checkPermission } from "@/lib/abac-client";

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

  const canRead = await checkPermission(project.id, "settings:read");
  const canWriteSettings = await checkPermission(project.id, "settings:write");
  const readOnly = !canWriteSettings;

  if (!canRead) {
    return <div>{t('noAccess', { settings: t('general') })}</div>;
  }

  return (
    <>
      <ProjectCard project={project} readOnly={readOnly} />
      <UploadImageCard project={project} readOnly={readOnly} />
    </>
  )
}
