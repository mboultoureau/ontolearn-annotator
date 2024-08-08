import prisma from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import PlaygroundComponent from "@/app/_components/playground/playground";

export default async function Playground({
  params,
}: {
  params: { slug: string };
}) {
  const t = await getTranslations("Playground.Index");

  const project = await prisma.project.findFirst({
    where: {
      slug: params.slug,
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <PlaygroundComponent projectId={project.id} />
  );
}
