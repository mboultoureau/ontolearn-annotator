import { z } from "zod";

export const createProjectInputSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(4, "Name must be at least 4 characters")
    .max(100, "Name must be less than 100 characters"),
  slug: z
    .string({ required_error: "Slug is required" })
    .min(4, "Slug must be at least 4 characters")
    .max(100, "Slug must be less than 100 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    )
    .refine((value) => value !== "create", {
      message: "Slug must be different than 'create'",
    }),
  description: z
    .string({ required_error: "Description is required" })
    .min(10, "Description must be at least 10 characters")
    .max(10000, "Description must be less than 10000 characters"),
  visibility: z.enum(["public", "private"], {
    required_error: "Visibility is required",
  }),
  categories: z.array(z.string()).min(1),
});

export const updateUseHeadworkInputSchema = z.object({
  id: z.string(),
  useHeadwork: z.boolean()
});
