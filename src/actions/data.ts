"use server"

import { createDataInputSchema } from "@/lib/validation-schemas/data";
import { authedProcedure } from "@/lib/zsa-procedures";
import { writeFileSync } from 'fs';
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';

export type FormState = {
    message: string;
    fields?: Record<string, string>;
    issues?: string[];
};

export const createData = authedProcedure
    .createServerAction()
    .input(createDataInputSchema, {
        type: "formData"
    })
    .handler(async ({ input, ctx }) => {
        const { sourceTypeId } = input;
        const { user, prisma } = ctx;

        const sourceType = await prisma.sourceType.findUnique({
            where: {
                id_sourceType: sourceTypeId
            },
            include: {
                fields: true
            }
        });

        if (!sourceType) {
            throw new Error("Source type not found");
        }

        // Validate each fields
        sourceType.fields.forEach((field) => {
            if (!input[`fields[${field.id_sourceType}]`]) {
                throw new Error(`Field ${field.label} is required`);
            }

            if (field.type === "FILE" && !(input[`fields[${field.id_sourceType}]`] instanceof File)) {
                throw new Error(`Field ${field.label} must be a file`);
            }

            if (field.type === "STRING" && typeof input[`fields[${field.id_sourceType}]`] !== "string") {
                throw new Error(`Field ${field.label} must be a string`);
            }
        });

        const project = await prisma.project.findFirst({
            where: {
                sources: {
                    some: {
                        id_sourceType: sourceTypeId
                    }
                }
            }
        });

        if (!project) {
            throw new Error("Project not found");
        }


        // Handle all file uploads
        for (const field of sourceType.fields) {
            if (field.type === "FILE") {
                // Write the file to the disk
                const file = input[`fields[${field.id_sourceTypeField}]`];
                const extension = file.name.split('.').pop()?.toLocaleLowerCase();
                const fileName = `${uuidv4()}.${extension}`;

                const path = `${process.cwd()}/public/uploads/${fileName}`;
                const arrayBuffer = await file.arrayBuffer();
                const buffer = new Uint8Array(arrayBuffer);

                writeFileSync(path, buffer);
                // input[`fields[${field.id}]`] = `/uploads/${fileName}`;
            }
        }

        const fields = sourceType.fields.map((field) => {
            return {
                fieldId: field.id_sourceTypeField,
                value: input[`fields[${field.id_sourceTypeField}]`], // Ensure this retrieves the correct value
                field: {
                    connect: { id: field.id_sourceTypeField }
                }
            }
        });

        // Now we can create the data
        const source = await prisma.dataSource.create({
            data: {
              id_dataSource: uuidv4(),              // obligatoire car pas de @default
              id_sourceType: sourceType.id_sourceType, // on relie à un SourceType existant
              id_project: project.id_project,       // relation vers Project
              name: "New data",                     
              sourceStatus: "PENDING",              
            },
        });


        revalidatePath(`/projects/${project.slug}/data`);
        redirect(`/projects/${project.slug}/data`)
    })