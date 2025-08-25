"use server";

import { setUserLocale } from "@/lib/locale";
import { updateLocaleInputSchema, updateThemeInputSchema } from "@/lib/validation-schemas/accounts";
import { authedProcedure } from "@/lib/zsa-procedures";
import { getTranslations } from "next-intl/server";

export const updateLocale = authedProcedure
    .createServerAction()
    .input(updateLocaleInputSchema)
    .handler(async ({ input, ctx }) => {
        const { user, prisma } = ctx;
        const t = await getTranslations('Account.Settings');

        // Update the user's language in the database
        await prisma.user.update({
            where: {
                id_user: user.id_user,
            },
            data: {
                locale: input.locale,
            },
        });

        // Update the user's language in the session
        setUserLocale(input.locale);

        return {
            message: t("languageUpdated"),
        };
    })

export const updateTheme = authedProcedure
    .createServerAction()
    .input(updateThemeInputSchema)
    .handler(async ({ input, ctx }) => {
        const { user, prisma } = ctx;
        const t = await getTranslations('Account.Settings');

        // Update the user's language in the database
        await prisma.user.update({
            where: {
                id_user: user.id_user,
            },
            data: {
                theme: input.theme,
            },
        });

        return {
            message: t("themeUpdated"),
        };
    })