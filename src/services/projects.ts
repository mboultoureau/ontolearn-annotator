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
        return Promise.reject("User not authenticated");
    }

    console.log("Fetching projects and categories by user", session.user.id)

    return prisma.category.findMany({
        where: {
            projects: {
                some: {
                    OR: [
                        { visibility: "PUBLIC" },
                        {
                            members: {
                                some: {
                                    userId: session.user.id
                                }
                            }
                        }
                    ]
                }
            }
        },
        include: {
            projects: {
                orderBy: {
                    name: "asc"
                },
                where: {
                    OR: [
                        { visibility: "PUBLIC" },
                        { members: { some: { userId: session.user.id } } }
                    ]
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
        return Promise.reject("User not authenticated");
    }

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
                    OR: [
                        { visibility: "PUBLIC" },
                        { members: { some: { userId: session.user.id } } }
                    ]
                }
            ]
        },
        ...args
    });
}