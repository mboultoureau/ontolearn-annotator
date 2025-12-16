import { getTaskByProjectIdInputSchema } from "@/lib/validation-schemas/task";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";

export const taskRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getTaskByProjectIdInputSchema)
    .query(async ({ ctx, input }) => {
      const { projectId } = input;

      // Verify ABAC permissions
      const projectPermission = ctx.session.permissions?.projects?.find(p => p.id === projectId);
      if (!projectPermission) {
        throw new Error("You don't have access to this project");
      }

      if (!projectPermission.permissions.task.read) {
        throw new Error("You don't have permission to read tasks");
      }

      return db.task.findMany({
        where: {
          projectId,
        },
      });
    }),

    getOne: protectedProcedure
    .input(getTaskByProjectIdInputSchema)
    .query(async ({ ctx, input }) => {
      const { projectId } = input;

      // Verify ABAC permissions
      const projectPermission = ctx.session.permissions?.projects?.find(p => p.id === projectId);
      if (!projectPermission) {
        throw new Error("You don't have access to this project");
      }

      if (!projectPermission.permissions.task.read) {
        throw new Error("You don't have permission to read tasks");
      }

      return db.task.findFirst({
        where: {
          projectId,
        },
      });
    }),
});
