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
        projectId: ctx.project.id,
        status: "PENDING",
        input: inputJSON,
        createdById: user.id,
      },
    });

    return playgroundTask;
  });
