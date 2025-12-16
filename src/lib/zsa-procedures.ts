import prisma from "@/lib/prisma";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerActionProcedure } from "zsa";

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

export const isAdminOfProject = createServerActionProcedure(authedProcedure)
    .input(
        z.object({ projectId: z.string() })
    )
    .handler(async({ input, ctx }) => {
        const session = await auth();
        const projectIds = session?.permissions?.projects?.map(p => p.id) ?? [];
        
        if (!projectIds.includes(input.projectId)) {
            throw new Error("You are not a member of this project");
        }

        const projectPermission = session?.permissions?.projects?.find(p => p.id === input.projectId);
        if (projectPermission?.role !== "ADMIN") {
            throw new Error("You are not an admin of this project");
        }

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

export const isMemberOfProject = createServerActionProcedure(authedProcedure)
    .input(
        z.object({ projectId: z.string() })
    )
    .handler(async({ input, ctx }) => {
        const session = await auth();
        const projectIds = session?.permissions?.projects?.map(p => p.id) ?? [];
        
        if (!projectIds.includes(input.projectId)) {
            throw new Error("You are not a member of this project");
        }

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