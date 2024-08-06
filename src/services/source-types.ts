import prisma from '@/lib/prisma';
import { auth } from '@/server/auth';

export async function fetchSourceTypes(projectId: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return Promise.reject("User not authenticated");
    }

    return await prisma.sourceType.findMany({
        where: {
            projectId: projectId,
            project: {
                members: {
                    some: {
                        userId: session.user.id,
                    },
                },
            },
        },
        include: {
            project: true,
        }
    });
}

export async function fetchSourceType(projectSlug: string, sourceTypeName: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return Promise.reject("User not authenticated");
    }

    return await prisma.sourceType.findFirst({
        where: {
            name: sourceTypeName,
            project: {
                slug: projectSlug,
                members: {
                    some: {
                        userId: session.user.id,
                    },
                },
            },
        },
        include: {
            project: true,
            fields: true
        }
    });
}