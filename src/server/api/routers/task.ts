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

      return db.task.findFirst({
        where: {
          projectId,
        },
      });
    }),
});
