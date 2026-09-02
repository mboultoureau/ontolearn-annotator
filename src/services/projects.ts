import prisma from "@/lib/prisma";
import { auth } from "@/server/auth";
import { checkPermission } from "@/lib/abac-client";
import { Prisma } from "@prisma/client";

const categoriesWithProjects = Prisma.validator<Prisma.CategoryDefaultArgs>()({
    include: { projects: true },
})

export type CategoriesWithProjects = Prisma.CategoryGetPayload<typeof categoriesWithProjects>[]

export const fetchProjectsAndCategoriesByUser = async (): Promise<CategoriesWithProjects> => {
    const session = await auth();

    if (!session?.user?.id) {
        return Promise.reject(new Error("User not authenticated"));
    }

    // Get all projects user is a member of
    const projectMembers = await prisma.projectMember.findMany({
        where: { userId: session.user.id },
        select: { projectId: true }
    });

    const projectIds = projectMembers.map(pm => pm.projectId);
    
    // Filter projects by checking read permission
    const accessibleProjectIds: string[] = [];
    for (const projectId of projectIds) {
        const hasAccess = await checkPermission(projectId, "project:read");
        if (hasAccess) {
            accessibleProjectIds.push(projectId);
        }
    }
    
    return prisma.category.findMany({
        where: {
            projects: {
                some: {
                    id: {in: accessibleProjectIds}
                }
            }
        },
        include: {
            projects: {
                orderBy: {
                    name: "asc"
                },
                where: {
                    id: { in: accessibleProjectIds }
                }
            }
        },
        orderBy: {
            name: "asc"
        }
    });
}

export const fetchProject = async ({ slug, args }: { slug: string, args?: any }): Promise<any> => {
    const session = await auth();

    if (!session?.user?.id) {
        return Promise.reject(new Error("User not authenticated"));
    }

    // First find the project by slug
    const project = await prisma.project.findUnique({
        include: {
            categories: true
        },
        where: {
            slug: slug,
        },
        ...args
    });

    if (!project) {
        return null;
    }

    // Check permission to read the project
    const hasAccess = await checkPermission(project.id, "project:read");
    if (!hasAccess) {
        return null;
    }

    return project;
}