"use server";

import { uploadPlaygroundInputSchema } from "@/lib/validation-schemas/playground";
import { isMemberOfProject } from "@/lib/zsa-procedures";
import { Prisma } from "@prisma/client";
import { writeFileSync } from "fs";
import { v4 as uuidv4 } from "uuid";

export const uploadPlayground = isMemberOfProject
  .createServerAction()
  .input(uploadPlaygroundInputSchema, {
    type: "formData",
  })
  .handler(async ({ input, ctx }) => {
    const { user, prisma } = ctx;
    const { file } = input;

    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const path = `/uploads/playground/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    writeFileSync(`public${path}`, buffer);

    const inputJSON = {
      file: path,
    } as Prisma.JsonObject;

    const playgroundTask = await prisma.playgroundTask.create({
      data: {
        id_pgTask: uuidv4(),                   // Obligatoire, pas de default dans le modèle
        id_project: ctx.project.id_project,
        id_user: user.id_user,
        playgroundTaskStatus: "PENDING",      // optionnel vu que tu as un default
        input: inputJSON,
        updatedAt: new Date(), 
      },
    });

    return playgroundTask;
  });
