import prisma from "@/lib/prisma";
import { auth } from "@/server/auth";

export type HeaderStatistics = {
    accuracy: {
        value: number;
    };
    data: {
        value: number;
    };
    annotatedData: {
        value: number;
    };
    users: {
        value: number;
    };
}

export async function fetchHeaderStatistics(projectId: string): Promise<HeaderStatistics> {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error("User not authenticated");
    }

    const projectIds = session.permissions?.projects.map(project => project.id) || [];

    if (!projectIds.includes(projectId)) {
        throw new Error("Access denied to this project");
    }

    // Simulate long running operation
    await new Promise(resolve => setTimeout(resolve, 10));

    const numberOfUsers = await prisma.projectMember.count({
        where: {
            projectId: projectId
        }
    })

    const numberOfData = await prisma.data.count({
        where: {
            projectId: projectId
        }
    });

    const numberOfDataThisMonth = await prisma.data.count({
        where: {
            projectId: projectId,
            uploadedAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
            }
        }
    });

    const accuracy = await prisma.statistics.findFirst({
        where: {
            projectId: projectId,
            epoch: {
                gte: 0
            }
        },
        orderBy: {
            epoch: 'desc'
        }
    });

    return {
        accuracy: {
            value: accuracy ? accuracy.accuracy : 0.0,
        },
        data: {
            value: numberOfData,
        },
        annotatedData: {
            value: 0.0,
        },
        users: {
            value: numberOfUsers,
        }
    }
}