import prisma from "@/lib/prisma";
import { SourceStatus } from "@prisma/client";
import { NextRequest } from "next/server";

type Props = {
    params: {
        projectId: string;
    };
};

export async function GET(request: NextRequest, { params } : Props) {
    // Check if the project exists
    const project = await prisma.project.findUnique({
        where: {
            id_project: params.projectId
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
    
    const status = request.nextUrl.searchParams.get('status');
    let where: {
        id_project: string;
        sourceStatus?: SourceStatus;
    } = {
        id_project: params.projectId
    };

    if (status && status in SourceStatus) {
        where = {
            ...where,
            sourceStatus: status as SourceStatus
        };
    }

    const sources = await prisma.dataSource.findMany({
        where, // <-- on réutilise le where préparé juste avant
        include: {
            fields: true,
            sourceType: true,
        },
    });


    return new Response(JSON.stringify(sources), {
        headers: {
            "content-type": "application/json",
        },
    });   
}