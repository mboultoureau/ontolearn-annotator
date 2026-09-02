import prisma from "@/lib/prisma";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerActionProcedure } from "zsa";
import { requireWrite } from "@/lib/abac-guards";

export const authedProcedure = createServerActionProcedure()
    .handler(async() => {
        const session = await auth();

        if (!session?.user?.id) {
            redirect("/login")
        }

        const user = await prisma.user.findUnique({
            where: {
                id: session.user.id
            }
        });

        if (!user) {
            redirect("/login")
        }

        return {
            user: user,
            prisma: prisma
        }
    }
)

export const canWriteSettings = createServerActionProcedure(authedProcedure)
    .input(
        z.object({ projectId: z.string() })
    )
    .handler(async({ input, ctx }) => {
        // Use new ABAC system to check settings:write permission
        await requireWrite(input.projectId, "settings");

        const project = await ctx.prisma.project.findUnique({
            where: {
                id: input.projectId
            }
        });

        if (!project) {
            throw new Error("Project not found");
        }

        return {
            ...ctx,
            project: project 
        }
    }
)
export const canWritePlayground = createServerActionProcedure(authedProcedure)
    .input(
        z.object({ projectId: z.string() })
    )
    .handler(async({ input, ctx }) => {
        // Use new ABAC system to check playground:write permission
        await requireWrite(input.projectId, "playground");

        const project = await ctx.prisma.project.findUnique({
            where: {
                id: input.projectId
            }
        });

        if (!project) {
            throw new Error("Project not found");
        }

        return {
            ...ctx,
            project: project 
        }
    }
)