"use server";

import prisma from "@/lib/prisma";
import { uploadImageInputSchema } from "@/lib/validation-schemas/project-image";
import { canWriteSettings } from "@/lib/zsa-procedures";
import fs from "fs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const uploadImage = canWriteSettings
    .createServerAction()
    .input(uploadImageInputSchema, {
        type: "formData"
    })
    .handler(async ({ input, ctx }) => {
        const project = ctx.project;

        if (project.image) {
            // Remove old image from database
            await prisma.project.update({
                where: {
                    id: project.id,
                },
                data: {
                    image: null
                },
            });

            // Remove old image from storage
            fs.unlinkSync(`${process.cwd()}/public/img/projects/${project.image}`);
        }

        // Save new image to storage
        const fileName = `${project.id}.png`;
        const path = `${process.cwd()}/public/img/projects/${fileName}`;
        const image: File = input.image;

        try {
            const arrayBuffer = await image.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);
            fs.writeFileSync(path, buffer);
        } catch (error) {
            throw new Error("Failed to save image");
        }

        // Update project with new image
        await prisma.project.update({
            where: {
                id: project.id,
            },
            data: {
                image: fileName
            },
        });

        revalidatePath(`/projects`);
        revalidatePath(`/projects/${project.slug}/settings`);
        redirect(`/projects/${project.slug}/settings`);
    })