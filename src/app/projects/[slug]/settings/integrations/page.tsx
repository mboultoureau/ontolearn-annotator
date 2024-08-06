import ProjectCard from "@/app/_components/projects/project-card";
import UploadImageCard from "@/app/_components/projects/upload-image-card";
import IntegrationApi from "@/app/_components/settings/integration-api";
import IntegrationHeadwork from "@/app/_components/settings/integration-headwork";
import { fetchProject } from "@/services/projects";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

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

  return (
    <>
      <IntegrationApi projectId={project.id} />
      <IntegrationHeadwork />
    </>
  );
}
