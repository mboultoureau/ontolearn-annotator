import { checkPermission } from "@/lib/abac-client";
import { fetchProject } from "@/services/projects";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ClassTypesClient } from "./class-types-client";

type Props = {
  params: {
    slug: string;
  };
};

/**
 * Resolves the permissions server-side and hands the result to the client component,
 * following the same shape as the users and integrations settings pages.
 *
 * The class-types API refuses writes from anyone without settings:write with a 403, so
 * without this the buttons would be offered and then fail on click.
 */
export default async function ClassTypesPage({ params }: Props) {
  const t = await getTranslations("Project.Settings");
  const project = await fetchProject({ slug: params.slug });

  if (!project) {
    notFound();
  }

  const canRead = await checkPermission(project.id, "settings:read");
  const readOnly = !(await checkPermission(project.id, "settings:write"));

  if (!canRead) {
    return <div>{t("noAccess", { settings: t("classTypes") })}</div>;
  }

  return <ClassTypesClient slug={params.slug} readOnly={readOnly} />;
}
