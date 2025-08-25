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

      return db.question.findMany({
        where: {
          id_project: projectId,
        },
      });
    }),

    getOne: protectedProcedure
    .input(getTaskByProjectIdInputSchema)
    .query(async ({ ctx, input }) => {
      const { projectId } = input;

      return db.question.findFirst({
        where: {
          id_project: projectId,
        },
      });
    }),
});
