import { z } from "zod";

export const updateLocaleInputSchema = z.object({
    locale: z.enum(['ENGLISH', 'FRENCH', 'JAPANESE'])
})

export const updateThemeInputSchema = z.object({
    theme: z.enum(['SYSTEM', 'LIGHT', 'DARK'])
})