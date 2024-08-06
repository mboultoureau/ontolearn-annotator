import ProjectCard from "@/app/_components/projects/project-card"
import UploadImageCard from "@/app/_components/projects/upload-image-card"
import { fetchProject } from "@/services/projects"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"

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

  return (
    <>
      <ProjectCard project={project} />
      <UploadImageCard project={project} />
    </>
  )
}
