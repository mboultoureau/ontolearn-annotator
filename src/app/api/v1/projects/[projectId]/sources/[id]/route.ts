type Props = {
    params: {
        projectId: string;
        id: string;
    };
};

export async function PATCH(request: Request, { params } : Props) {
    const { projectId } = params;
    const { status } = await request.json();

    const updatedSource = await prisma.source.update({
        where: {
            id: params.id,
            projectId,
        },
        data: {
            status,
        },
    });

    return new Response(JSON.stringify(updatedSource), {
        headers: {
            "content-type": "application/json",
        },
    });
}