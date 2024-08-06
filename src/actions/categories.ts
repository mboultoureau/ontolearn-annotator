"use server"

import { categorySchema } from "@/lib/zod";
import { auth } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCategory(prevState: any, formData: any) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const result = categorySchema.safeParse({
        id: formData.id,
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        icon: formData.icon,
    });

    if (!result.success) {
        return {
            success: false,
            message: "Invalid form data",
            errors: result.error.flatten().fieldErrors,
        };
    }

    const { id, name, slug, description, icon } = result.data;

    // Check if slug is already taken
    const existingCategory = await prisma.category.findUnique({
        where: {
            slug,
        },
    });
    if (existingCategory) {
        console.log("Slug is already taken")
        return {
            message: "Slug is already taken",
        };
    }

    // Insert the category into the database
    const project = await prisma.category.create({
        data: {
            name,
            slug,
            description,
            icon: icon
        },
    });

    revalidatePath('/projects');

    return {
        success: true
    }
}