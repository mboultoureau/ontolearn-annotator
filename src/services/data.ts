import prisma from "@/lib/prisma";

export default async function fetchLastData(projectId: string) {
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