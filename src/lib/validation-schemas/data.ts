import { z } from 'zod';

export const createDataInputSchema = z.object({
        sourceTypeId: z.string().min(1, "Source type is required"),
    }).and(
        z.record(z.string(), z.any())
    )
