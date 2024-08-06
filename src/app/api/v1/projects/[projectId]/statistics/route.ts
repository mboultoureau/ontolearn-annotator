import { z } from "zod";

type Props = {
    params: {
        projectId: string;
    };
};


export async function POST(
    request: Request,
    { params }: Props
) {
    const schema = z.object({
        epoch: z.number(),
        loss: z.number(),
        accuracy: z.number(),
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

    const createdData = await prisma.statistics.create({
        data: {
            ...data.data,
            projectId: params.projectId,
        }
    });

    return new Response(JSON.stringify(createdData), {
        headers: {
            "content-type": "application/json",
        },
    });
}