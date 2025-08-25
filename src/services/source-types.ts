import prisma from '@/lib/prisma';
import { auth } from '@/server/auth';

export async function fetchSourceTypes(projectId: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return Promise.reject("User not authenticated");
    }

    return await prisma.sourceType.findMany({
        where: {
            sources: {
                some: {
                    id_project: projectId,
                    project: {
                        members: {
                            some: {
                                id_user: session.user.id,
                            },
                        },
                    },
                },
            },
        },
        include: {
            sources: {
                include: {
                    project: true,
                },
            },
        },
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
            sources: {
                some: {
                    project: {
                        slug: projectSlug,
                        members: {
                            some: {
                                id_user: session.user.id,
                            },
                        },
                    },
                },
            },
        },
        include: {
            sources: {
                include: {
                    project: true,
                },
            },
            fields: true,
        },
    });
}
