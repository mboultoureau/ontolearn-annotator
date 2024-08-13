import ImageSegmentation from "@/app/_components/task/image-segmentation/image-segmentation";
import { api, HydrateClient } from "@/trpc/server";
import dynamic from "next/dynamic";
import { db } from "@/server/db";
import { notFound } from "next/navigation";

// const ImageSegmentation = dynamic(() => import("@/app/_components/task/image-segmentation/image-segmentation"),
//   {
//     ssr: false,
//   },
// );

export default async function MyCustomViewer({ params }: { params: { slug: string } }) {
  const project = await db.project.findFirst({
    where: {
      slug: params.slug,
    },
  });

  if (!project) {
    notFound();
  }

  const task = await api.task.getOne({
    projectId: project.id ?? "",
  });

  const image = task?.input!.image;

  return (
    <HydrateClient>
      <ImageSegmentation image={image} annotations={[]} />
    </HydrateClient>
  );
};