import FlowBuilder from "@/app/_components/task/flow-builder/flow-builder";
import { fetchProject } from "@/services/projects";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { checkPermission } from "@/lib/abac-client";

type Props = {
  params: {
    slug: string;
  };
};

export default async function Flow({ params }: Props) {
  const t = await getTranslations("Project.Settings");
  const project = await fetchProject({ slug: params.slug });

  if (!project) {
    notFound();
  }

  const canRead = await checkPermission(project.id, "settings:read");

  if (!canRead) {
    return <div>{t('noAccess', { settings: t('tasks') })}</div>;
  }

  return (
    <>
      <FlowBuilder />
    </>
  );
}