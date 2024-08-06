"use server";

import prisma from "@/lib/prisma";
import { uploadImageInputSchema } from "@/lib/validation-schemas/project-image";
import { isAdminOfProject } from "@/lib/zsa-procedures";
import { auth } from "@/server/auth";
import fs from "fs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { projectSchema } from "../lib/zod";

export async function createProject(prevState: any, formData: any) {
    const session = await auth();

    if (!session?.user?.id) {
        return {
            message: "You must be logged in to create a project",
        };
    }

    const result = projectSchema.safeParse({
        id: formData.id,
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        visibility: formData.visibility,
        categories: formData.categories
    });

    if (!result.success) {
        return {
            success: false,
            message: "Invalid form data",
            errors: result.error.flatten().fieldErrors,
        };
    }

    const { id, name, slug, description, visibility } = result.data;

    // Check if slug is already taken
    const existingProject = await prisma.project.findUnique({
        where: {
            slug,
        },
    });
    if (existingProject) {
        return {
            success: false,
            message: "Slug is already taken",
        };
    }

    const categories = formData?.categories.map((category: string) => {
        return { id: category };
    });

    console.log(categories)

    // Insert the project into the database
    const project = await prisma.project.create({
        data: {
            name,
            slug,
            description,
            visibility: visibility === "public" ? "PUBLIC" : "PRIVATE",
            categories: {
                connect: categories
            }
        },
    });

    // Create project member
    const admin = await prisma.projectMember.create({
        data: {
            projectId: project.id,
            userId: session.user.id,
            role: "ADMIN",
        },
    });

    revalidatePath('/projects');
    redirect(`/projects/${project.slug}`);
}

export const uploadImage = isAdminOfProject
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