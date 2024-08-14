"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dataTypeSchema } from "../lib/zod";
import { auth } from "@/server/auth";

export type StateResponse = {
    success?: boolean,
    message?: string,
    errors?: any,
};

export async function createDataType(projectId: string, prevState: any, formData: any): Promise<StateResponse> {
    // Check if the user is logged in
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    // Validate if the form data is correct
    const result = dataTypeSchema.safeParse({
        id: formData.id,
        name: formData.name,
        label: formData.label,
        icon: formData.icon,
        fields: formData.fields
    });

    if (!result.success) {
        return {
            success: false,
            message: "Invalid form data",
            errors: result.error.flatten().fieldErrors,
        };
    }

    const { id, name, label, icon, fields } = result.data;

    // Check if the project exists and the user has access to it
    const member = await prisma.projectMember.findFirst({
        where: {
            projectId: projectId,
            userId: session.user.id,
        },
        include: {
            project: true
        }
    });

    if (!member) {
        return {
            success: false,
            message: "You do not have access to this project or it does not exist",
        };
    }

    // Check if the id is provided
    if (id) {
        // Edit the current dataType
        const existingDataType = await prisma.sourceType.findUnique({
            where: {
                id: formData.id,
            },
            include: {
                fields: true
            }
        });
        if (!existingDataType) {
            return {
                success: false,
                message: "Data type with the provided id does not exist",
            };
        }

        const updatedFields = fields.filter((field: any) => field.id);
        const createdFields = fields.filter((field: any) => !field.id);
        const removedFieldIds = existingDataType.fields
            .filter((field: any) => !fields.some((f: any) => f.id === field.id))
            .map((field: any) => field.id);

        await prisma.sourceType.update({
            where: {
                id: formData.id,
            },
            data: {
                name,
                label,
                icon,
                fields: {
                    create: createdFields,
                },
            },
        });

        // Update the existing fields
        for (const field of updatedFields) {
            await prisma.sourceTypeField.update({
                where: {
                    id: field.id,
                },
                data: {
                    name: field.name,
                    label: field.label,
                    type: field.type,
                    required: field.required,
                },
            });
        }

        // Delete the removed fields
        await prisma.sourceTypeField.deleteMany({
            where: {
                id: {
                    in: removedFieldIds,
                },
            },
        });

        revalidatePath(`/projects/${member.project.slug}/settings/data-types`);
        redirect(`/projects/${member.project.slug}/settings/data-types`);

        return {
            success: true,
            message: "Data type updated successfully",
        }
    }

    // Insert the project into the database
    await prisma.sourceType.create({
        data: {
            name,
            label,
            icon,
            fields: {
                create: fields,
            },
            projectId: projectId
        },
    });

    revalidatePath(`/projects/${member.project.slug}/settings/source-types`);
    redirect(`/projects/${member.project.slug}/settings/source-types`);
}

export async function deleteDataType(dataTypeId: string): Promise<StateResponse> {
    // Check if the user is logged in
    const session = await auth();

    if (!session?.user?.id) {
        return {
            success: false,
            message: "You must be logged in to delete a data type",
        };
    }

    // Check if the data type exists and the user has access to it
    const dataType = await prisma.sourceType.findFirst({
        where: {
            id: dataTypeId,
            project: {
                members: {
                    some: {
                        userId: session.user.id,
                    },
                },
            },
        },
    });

    if (!dataType) {
        return {
            success: false,
            message: "You do not have access to this data type or it does not exist",
        };
    }

    // Delete the data type
    await prisma.sourceType.delete({
        where: {
            id: dataTypeId,
        },
    });

    revalidatePath(`/projects/${dataType.projectId}/settings/source-types`);
    redirect(`/projects/${dataType.projectId}/settings/source-types`);
}