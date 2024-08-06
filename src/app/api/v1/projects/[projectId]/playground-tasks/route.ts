import prisma from "@/lib/prisma";

type Props = {
    params: {
        projectId: string;
    };
};

export async function GET(request: Request, { params } : Props) {
    // Check if the project exists
    const project = await prisma.project.findUnique({
        where: {
            id: params.projectId
        }
    });

    if (!project) {
        return new Response(JSON.stringify({ error: "Project not found" }), {
            status: 404,
            headers: {
                "content-type": "application/json",
            },
        });
    }

    const sources = await prisma.playgroundTask.findMany({
        where: {
            projectId: params.projectId,
            status: "PENDING"
        }
    });

    return new Response(JSON.stringify(sources), {
        headers: {
            "content-type": "application/json",
        },
    });   
}
