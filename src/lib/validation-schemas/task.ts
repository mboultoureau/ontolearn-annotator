import { z } from "zod";

export const getTaskByProjectIdInputSchema = z.object({
    projectId: z.string(),
});