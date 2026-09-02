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

        if (project.icon) {
            // Remove old image from database
            await prisma.project.update({
                where: {
                    id: project.id,
                },
                data: {
                    icon: null
                },
            });

            // Remove old image from storage. Guarded: the file may be gone already
            // (manual deletion, a wiped volume), and an unguarded unlink threw and
            // failed the whole upload.
            const previousIconPath = `${process.cwd()}/public/img/projects/${project.icon}`;
            if (fs.existsSync(previousIconPath)) {
                fs.unlinkSync(previousIconPath);
            }
        }

        // Save new image to storage
        const fileName = `${project.id}.png`;
        const path = `${process.cwd()}/public/img/projects/${fileName}`;
        const icon: File = input.icon;

        try {
            const arrayBuffer = await icon.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);
            fs.writeFileSync(path, buffer);
        } catch (error) {
            throw new Error("Failed to save icon");
        }

        // Update project with new icon
        await prisma.project.update({
            where: {
                id: project.id,
            },
            data: {
                icon: fileName
            },
        });

        revalidatePath(`/projects`);
        revalidatePath(`/projects/${project.slug}/settings`);
        redirect(`/projects/${project.slug}/settings`);
    })