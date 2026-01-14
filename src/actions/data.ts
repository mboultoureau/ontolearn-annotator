"use server"

import { createDataInputSchema } from "@/lib/validation-schemas/data";
import { authedProcedure } from "@/lib/zsa-procedures";
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

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
        const { sourceTypeId, destination = "MANUAL" } = input;
        const { user, prisma } = ctx;

        const sourceType = await prisma.sourceType.findUnique({
            where: {
                id: sourceTypeId
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
            if (!input[`fields[${field.id}]`]) {
                throw new Error(`Field ${field.label} is required`);
            }

            if (field.type === "FILE" && !(input[`fields[${field.id}]`] instanceof File)) {
                throw new Error(`Field ${field.label} must be a file`);
            }

            if (field.type === "STRING" && typeof input[`fields[${field.id}]`] !== "string") {
                throw new Error(`Field ${field.label} must be a string`);
            }
        });

        const project = await prisma.project.findFirst({
            where: {
                sourceTypes: {
                    some: {
                        id: sourceTypeId
                    }
                }
            }
        });

        if (!project) {
            throw new Error("Project not found");
        }


        // Determine upload directory based on destination
        const uploadDir = destination === "MANUAL" ? "playground" : "uploads";
        const fullUploadPath = path.join(process.cwd(), "public", "uploads", uploadDir);
        if (!existsSync(fullUploadPath)) {
            mkdirSync(fullUploadPath, { recursive: true });
        }

        // Handle all file uploads
        const uploadedFiles: Array<{ fieldId: string; filePath: string; fileName: string; extension: string; isImage: boolean }> = [];

        for (const field of sourceType.fields) {
            if (field.type === "FILE") {
                // Write the file to the disk
                const file = input[`fields[${field.id}]`];
                const extension = file.name.split('.').pop()?.toLocaleLowerCase();
                const fileUuid = uuidv4();
                const fileName = `${fileUuid}.${extension}`;

                const diskPath = path.join(fullUploadPath, fileName);
                const arrayBuffer = await file.arrayBuffer();
                const buffer = new Uint8Array(arrayBuffer);

                writeFileSync(diskPath, buffer);

                // Store metadata for DataFile creation
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg', 'dzi'].includes(extension || '');
                const isZip = extension === 'zip';

                uploadedFiles.push({
                    fieldId: field.id,
                    filePath: `/uploads/${uploadDir}/${fileName}`,
                    fileName: file.name,
                    extension: extension || '',
                    isImage: isImage && !isZip
                });
            }
        }

        const fields = sourceType.fields.map((field) => {
            return {
                fieldId: field.id,
                value: input[`fields[${field.id}]`], // Ensure this retrieves the correct value
                field: {
                    connect: { id: field.id }
                }
            }
        });

        // Now we can create the data
        const source = await prisma.source.create({
            data: {
                name: "New data",
                sourceTypeId,
                projectId: project.id,
                status: "PENDING",
            }
        });

        // Create DataFile only for image files (not ZIP)
        for (const fileInfo of uploadedFiles) {
            if (fileInfo.isImage) {
                // Determine file type based on extension
                let fileType: "IMAGE" | "DEEP_ZOOM_IMAGE" = "IMAGE";
                if (fileInfo.extension === 'dzi') {
                    fileType = "DEEP_ZOOM_IMAGE";
                }

                await prisma.dataFile.create({
                    data: {
                        sourceId: source.id,
                        name: fileInfo.fileName,
                        filePath: fileInfo.filePath,
                        type: fileType,
                        destination: destination as "MANUAL" | "ML" | "HEADWORK",
                    }
                });
            }
        }

        revalidatePath(`/projects/${project.slug}/data`);
        redirect(`/projects/${project.slug}/data`)
    })