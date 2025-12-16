import prisma from "@/lib/prisma";
import { auth } from "@/server/auth";
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

    const projectIds = session.permissions?.projects.map(project => project.id) || [];
    
    return prisma.category.findMany({
        where: {
            projects: {
                some: {
                    id: {in: projectIds}
                }
            }
        },
        include: {
            projects: {
                orderBy: {
                    name: "asc"
                },
                where: {
                    id: { in: projectIds }
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

    const projectIds = session.permissions?.projects.map(project => project.id) || [];

    return prisma.project.findFirst({
        include: {
            categories: true
        },
        where: {
            AND: [
                {
                    slug: slug,
                },
                {
                    id: { in: projectIds }
                }
            ]
        },
        ...args
    });
}