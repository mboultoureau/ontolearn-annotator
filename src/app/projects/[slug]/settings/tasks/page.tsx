import FlowBuilder from "@/app/_components/task/flow-builder/flow-builder";
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

export default async function Flow({ params }: Props) {
  const t = await getTranslations("Project.Settings");
  const project = await fetchProject({ slug: params.slug });

  if (!project) {
    notFound();
  }

  const permissions = await getAbacPermissions();
  const projectPermissions = getProjectPermissions(permissions, project.id);
  const readOnly = !canWrite(projectPermissions, "settings.task");

  return (
    <>
      <CanRead projectId={project.id} resource="settings.task" fallback={t('noAccess', { settings: t('tasks') })}>
        <FlowBuilder />
      </CanRead>
    </>
  );
}