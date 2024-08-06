import prisma from "@/lib/prisma";

type Props = {
    params: {
        projectId: string;
    };
};

export async function GET(request: Request, { params } : Props) {
    const sources = await prisma.source.findMany({
        where: {
            projectId: params.projectId,
            status: "PENDING"
        },
        include: {
            fields: true,
            type: true,
        }
    });

    return new Response(JSON.stringify(sources), {
        headers: {
            "content-type": "application/json",
        },
    });   
}