import { icons } from "@/lib/icons";
import { z } from "zod";

const iconsValues = icons.map(icon => icon.value);

export const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(4, "Name must be at least 4 characters")
    .max(100, "Name must be less than 100 characters"),
  slug: z.string({ required_error: "Slug is required" })
    .min(4, "Slug must be at least 4 characters")
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .refine(value => value !== "create", {
      message: "Slug must be different than 'create'",
    }),
  description: z
    .string({ required_error: "Description is required" })
    .min(10, "Description must be at least 10 characters")
    .max(10000, "Description must be less than 10000 characters"),
  visibility: z.enum(["PUBLIC", "PRIVATE"], { required_error: "Visibility is required" }),
  categories: z.array(z.string()).min(1)
});

export const dataTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string({ required_error: "Name is required" })
    .min(4, "Name must be at least 4 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-z0-9-]+$/, "Name can only contain lowercase letters, numbers, and hyphens")
    .refine(value => value !== "create", {
      message: "Name must be different than 'create'",
    }),
  label: z.string({ required_error: "Label is required" })
    .min(4, "Label must be at least 4 characters")
    .max(100, "Label must be less than 100 characters"),
  icon: z.enum(iconsValues.length === 0 ? ['default'] : iconsValues as [string], { required_error: "Icon is required" }),
  fields: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string({ required_error: "Name is required" })
        .min(4, "Name must be at least 4 characters")
        .max(100, "Name must be less than 100 characters")
        .regex(/^[a-z0-9-]+$/, "Name can only contain lowercase letters, numbers, and hyphens"),
      label: z.string({ required_error: "Label is required" })
        .min(4, "Label must be at least 4 characters")
        .max(100, "Label must be less than 100 characters"),
      type: z.string(),
      required: z.boolean(),
    })
  ).min(1)
});


export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string({ required_error: "Name is required" })
    .min(4, "Name must be at least 4 characters")
    .max(100, "Name must be less than 100 characters"),
  slug: z.string({ required_error: "Slug is required" })
    .min(4, "Slug must be at least 4 characters")
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .refine(value => value !== "create", {
      message: "Slug must be different than 'create'",
    }),
  description: z
    .string({ required_error: "Description is required" })
    .min(10, "Description must be at least 10 characters")
    .max(10000, "Description must be less than 10000 characters"),
  icon: z.enum(iconsValues.length === 0 ? ['default'] : iconsValues as [string], { required_error: "Icon is required" }),
});

