import {
  createProjectInputSchema,
  updateUseHeadworkInputSchema,
} from "@/lib/validation-schemas/project";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const projectRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createProjectInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if slug is already taken
      const existingProject = await ctx.db.project.findUnique({
        where: {
          slug: input.slug,
        },
      });

      if (existingProject) {
        throw new Error("Slug is already taken");
      }

      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
        },
      });

      await ctx.db.categoryToProject.createMany({
        data: input.categories.map((id_category) => ({
          id_project: project.id_project,
          id_category,
        })),
      });

      // Assign the project to the user
      await ctx.db.projectMember.create({
        data: {
          id_project: project.id_project,
          id_user: ctx.session.user.id,
          role: "ADMIN",
        },
      });

      return project;
    }),

  updateUseHeadwork: protectedProcedure
    .input(updateUseHeadworkInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if the project exists
      const project = await ctx.db.project.findUnique({
        where: {
          id_project: input.id,
        },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      return ctx.db.project.update({
        where: {
          id_project: input.id,
        },
        data: {
          useHeadwork: input.useHeadwork,
        },
      });
    }),
});
