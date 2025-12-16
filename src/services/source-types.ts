import prisma from '@/lib/prisma';
import { auth } from '@/server/auth';

export async function fetchSourceTypes(projectId: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return Promise.reject(new Error("User not authenticated"));
    }

    const projectIds = session.permissions?.projects.map(project => project.id) || [];

    // Verify user has access to this project
    if (!projectIds.includes(projectId)) {
        return Promise.reject(new Error("Access denied to this project"));
    }

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
    const session = await auth();

    if (!session?.user?.id) {
        return Promise.reject(new Error("User not authenticated"));
    }

    const projectIds = session.permissions?.projects.map(project => project.id) || [];

    return await prisma.sourceType.findFirst({
        where: {
            name: sourceTypeName,
            project: {
                slug: projectSlug,
                id: { in: projectIds }
            },
        },
        include: {
            project: true,
            fields: true
        }
    });
}