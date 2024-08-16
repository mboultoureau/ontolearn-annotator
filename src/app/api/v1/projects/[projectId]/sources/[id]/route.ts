import { SourceStatus } from "@prisma/client";
import { z } from "zod";

type Props = {
    params: {
        projectId: string;
        id: string;
    };
};

const statusInfoSchema = z.object({
    "message": z.string().optional(),
    "problems": z.array(z.string()).optional()
})

export async function PATCH(request: Request, { params } : Props) {
    const schema = z.object({
        name: z.string().optional(),
        status: z.nativeEnum(SourceStatus).optional(),
        statusInfo: statusInfoSchema.optional()
    })

    const { projectId } = params;
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

    const updatedSource = await prisma.source.update({
        where: {
            id: params.id,
            projectId,
        },
        data: {
            ...data.data
        }
    });

    return new Response(JSON.stringify(updatedSource), {
        headers: {
            "content-type": "application/json",
        },
    });
}