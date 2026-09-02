import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import PlaygroundComponent from "@/app/_components/playground/playground";
// Goes through the service so a denied project:read becomes null -> notFound().
import { fetchProject } from "@/services/projects";

export default async function Playground({
  params,
}: {
  params: { slug: string };
}) {
  const t = await getTranslations("Playground.Index");

  const project = await fetchProject({ slug: params.slug });

  if (!project) {
    notFound();
  }

  return (
    <PlaygroundComponent project={project} />
  );
}
