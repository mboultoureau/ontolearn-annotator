import { z } from "zod";

export const createDataInputSchema = z.any()

export const destinationSchema = z.enum(["MANUAL", "ML", "HEADWORK"])
