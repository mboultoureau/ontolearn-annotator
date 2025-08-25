import prisma from "@/lib/prisma";
import { z } from "zod";
import { randomUUID } from "crypto";
import path from "path";

type Props = {
  params: {
    projectId: string;
  };
};

export async function POST(request: Request, { params }: Props) {
  const schema = z.object({
    name: z.string(),
    type: z.enum(["IMAGE", "DEEP_ZOOM_IMAGE"]),
    content: z.string().optional(),
  });

  const body = await request.json();
  const data = schema.safeParse(body);

  if (!data.success) {
    return new Response(
      JSON.stringify({ error: "Invalid body", errors: data.error }),
      {
        status: 400,
        headers: { "content-type": "application/json" },
      }
    );
  }

  // 1️⃣ Trouver une source liée au projet
  const source = await prisma.dataSource.findFirst({
    where: { id_project: params.projectId },
  });

  if (!source) {
    return new Response(
      JSON.stringify({ error: "No data source found for this project" }),
      { status: 404, headers: { "content-type": "application/json" } }
    );
  }

  // 2️⃣ Créer le DataFile avec tous les champs obligatoires
  const createdData = await prisma.dataFile.create({
    data: {
      ...data.data, // garde name, type, content
      id_data: data.data.name, // clé primaire
      id_dataSource: source.id_dataSource, // pris automatiquement
      id_project: params.projectId,
      filePath: `/uploads/${data.data.name}`,
      previewPath: `/previews/${path.parse(data.data.name).name}.jpg`,
    },
  });

  return new Response(JSON.stringify(createdData), {
    headers: { "content-type": "application/json" },
  });
}
