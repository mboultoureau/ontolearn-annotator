import prisma from "@/lib/prisma";
import { auth } from "@/server/auth";

export default async function fetchLastData(projectId: string) {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error("User not authenticated");
    }

    const projectIds = session.permissions?.projects.map(project => project.id) || [];

    if (!projectIds.includes(projectId)) {
        throw new Error("Access denied to this project");
    }

    return await prisma.data.findMany({
        where: {
            projectId: projectId
        },
        orderBy: {
            uploadedAt: "desc"
        },
        take: 5
    });
}