import { z } from "zod";

export const createDataInputSchema = z.object({
  sourceTypeId: z.string().min(1, "Source type is required"),
  fields: z.array(
    z.object({
      id: z.string(),
      value: z.string().or(z.instanceof(FileList))
    })
  ),
});
