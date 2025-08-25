import prisma from "@/lib/prisma";
import { PlaygroundTaskStatus } from "@prisma/client";
import { NextRequest } from "next/server";

type Props = {
    params: {
        projectId: string;
    },
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
        playgroundTaskStatus?: PlaygroundTaskStatus;
    } = {
        id_project: params.projectId
    };

    if (status && status in PlaygroundTaskStatus) {
        where = {
            ...where,
            playgroundTaskStatus: status as PlaygroundTaskStatus
        };
    }

    const tasks = await prisma.playgroundTask.findMany({
        where: where
    });

    return new Response(JSON.stringify(tasks), {
        headers: {
            "content-type": "application/json",
        },
    });   
}
