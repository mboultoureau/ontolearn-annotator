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
          categories: {
            connect: input.categories.map((category) => {
              return { id: category };
            }),
          },
        },
      });

      // Assign the project to the user
      await ctx.db.projectMember.create({
        data: {
          projectId: project.id,
          userId: ctx.session.user.id,
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
          id: input.id,
        },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      return ctx.db.project.update({
        where: {
          id: input.id,
        },
        data: {
          useHeadwork: input.useHeadwork,
        },
      });
    }),
});
