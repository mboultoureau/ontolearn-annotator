import { updateLocaleInputSchema, updateThemeInputSchema } from "@/lib/validation-schemas/accounts";
import { createTRPCRouter, userProcedure } from "@/server/api/trpc";

export const accountRouter = createTRPCRouter({
  get: userProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  updateLocale: userProcedure
    .input(updateLocaleInputSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: {
          id_user: ctx.user.id_user,
        },
        data: {
          locale: input.locale,
        },
      });
    }),

  updateTheme: userProcedure
    .input(updateThemeInputSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: {
          id_user: ctx.user.id_user,
        },
        data: {
          theme: input.theme,
        },
      });
    }),
});
