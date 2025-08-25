import prisma from "@/lib/prisma";

export default async function fetchLastData(projectId: string) {
    return await prisma.dataFile.findMany({
        where: {
            id_project: projectId
        },
        orderBy: {
            uploadedAt: "desc"
        },
        take: 5
    });
}