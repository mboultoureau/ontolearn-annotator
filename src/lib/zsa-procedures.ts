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
        const project = await ctx.prisma.project.findUnique({
            where: {
                id: input.projectId,
                members: {
                    some: {
                        userId: ctx.user.id,
                        role: "ADMIN"
                    }
                }
            }
        });

        if (!project) {
            throw new Error("You are not an admin of this project")
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
        const project = await ctx.prisma.project.findUnique({
            where: {
                id: input.projectId,
                members: {
                    some: {
                        userId: ctx.user.id
                    }
                }
            }
        });

        if (!project) {
            throw new Error("You are not a member of this project")
        }

        return {
            ...ctx,
            project: project 
        }
    }
)