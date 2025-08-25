import prisma from "@/lib/prisma";
import { auth } from "@/server/auth";
import { Prisma } from "@prisma/client";

// Type helper pour inclure les projets liés aux catégories
const categoriesWithProjects = Prisma.validator<Prisma.CategoryToProjectDefaultArgs>()({
  include: { project: true },
});

export type CategoriesWithProjects =
  Prisma.CategoryToProjectGetPayload<typeof categoriesWithProjects>[];

/**
 * Récupère toutes les catégories et projets visibles pour l'utilisateur connecté
 */
export const fetchProjectsAndCategoriesByUser = async (): Promise<CategoriesWithProjects> => {
  const session = await auth();

  if (!session?.user?.id) {
    return Promise.reject(new Error("User not authenticated"));
  }

  console.log("Fetching projects and categories by user", session.user.id);

  return prisma.categoryToProject.findMany({
    where: {
      project: {
        OR: [
          { visibility: "PUBLIC" },
          {
            members: {
              some: { id_user: session.user.id },
            },
          },
        ],
      },
    },
    include: {
      project: {
        include: {
          members: true, // optionnel → supprime si pas nécessaire
          categories: true,
        },
      },
    },
    orderBy: { id_category: "asc" },
  });
};

/**
 * Récupère un projet par son slug si l'utilisateur y a accès
 */
export const fetchProject = async ({
  slug,
  args,
}: {
  slug: string;
  args?: any;
}): Promise<any> => {
  const session = await auth();

  if (!session?.user?.id) {
    return Promise.reject(new Error("User not authenticated"));
  }

  return prisma.project.findFirst({
    include: {
      categories: true,
      members: true, // optionnel
    },
    where: {
      AND: [
        { slug },
        {
          OR: [
            { visibility: "PUBLIC" },
            { members: { some: { id_user: session.user.id } } },
          ],
        },
      ],
    },
    ...args,
  });
};
