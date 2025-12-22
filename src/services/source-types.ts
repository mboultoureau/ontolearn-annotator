import prisma from '@/lib/prisma';
import { requireRead } from '@/lib/abac-guards';

export async function fetchSourceTypes(projectId: string) {
    // Check permission to read source types
    await requireRead(projectId, "sourceType");

    return await prisma.sourceType.findMany({
        where: {
            projectId: projectId,
        },
        include: {
            project: true,
        }
    });
}

export async function fetchSourceType(projectSlug: string, sourceTypeName: string) {
    // First find the project to get its ID
    const project = await prisma.project.findUnique({
        where: { slug: projectSlug },
        select: { id: true }
    });

    if (!project) {
        return Promise.reject(new Error("Project not found"));
    }

    // Check permission to read source types
    await requireRead(project.id, "sourceType");

    return await prisma.sourceType.findFirst({
        where: {
            name: sourceTypeName,
            project: {
                slug: projectSlug
            },
        },
        include: {
            project: true,
            fields: true
        }
    });
}