import { getTaskByProjectIdInputSchema } from "@/lib/validation-schemas/task";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { requireRead } from "@/lib/abac-guards";

export const taskRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getTaskByProjectIdInputSchema)
    .query(async ({ ctx, input }) => {
      const { projectId } = input;

      // Check read permission for tasks
      await requireRead(projectId, "task");

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

      // Check read permission for tasks
      await requireRead(projectId, "task");

      return db.task.findFirst({
        where: {
          projectId,
        },
      });
    }),
});
