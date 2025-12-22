import prisma from "@/lib/prisma";
import { requireRead } from "@/lib/abac-guards";

export default async function fetchLastData(projectId: string) {
    // Check permission to read data
    await requireRead(projectId, "data");

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