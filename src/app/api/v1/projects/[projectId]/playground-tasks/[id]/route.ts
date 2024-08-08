import { z } from "zod";

type Props = {
    params: {
        projectId: string;
        id: string;
    };
};

export async function GET(
    request: Request,
    { params } : Props
) {
    const playground = await prisma.playgroundTask.findUnique({
        where: {
            id: params.id,
            projectId: params.projectId,
        },
    });

    if (!playground) {
        return new Response(JSON.stringify({ error: "Playground not found" }), {
            status: 404,
            headers: {
                "content-type": "application/json",
            },
        });
    }

    return new Response(JSON.stringify(playground), {
        headers: {
            "content-type": "application/json",
        },
    });
}

export async function PATCH(
    request: Request,
    { params } : Props
) {
    const schema = z.object({
        output: z.any(),
        status: z.enum(["PENDING", "PROCESSING", "FAILED", "COMPLETED"])
    });

    const body = await request.json();
    const data = schema.safeParse(body);

    if (!data.success) {
        return new Response(JSON.stringify({ error: "Invalid body", errors: data.error }), {
            status: 400,
            headers: {
                "content-type": "application/json",
            },
        });
    }

    const playground = await prisma.playgroundTask.findUnique({
        where: {
            id: params.id,
            projectId: params.projectId,
        },
    });

    if (!playground) {
        return new Response(JSON.stringify({ error: "Playground not found" }), {
            status: 404,
            headers: {
                "content-type": "application/json",
            },
        });
    }

    const updatedPlayground = await prisma.playgroundTask.update({
        where: {
            id: params.id,
        },
        data: {
            output: data.data.output,
            status: data.data.status,
        }
    });

    return new Response(JSON.stringify(updatedPlayground), {
        headers: {
            "content-type": "application/json",
        },
    });
}