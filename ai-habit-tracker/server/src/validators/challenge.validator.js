import { z } from "zod";

export const createChallengeSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(3, "Title must be at least 3 characters"),
  description: z
    .string({ required_error: "Description is required" })
    .trim()
    .min(5, "Description must be at least 5 characters"),
  durationDays: z.coerce.number().int().min(1, "Duration must be at least 1 day").optional(),
  targetCount: z.coerce.number().int().min(1, "Target count must be at least 1").optional(),
  category: z.string().optional(),
});

export const updateChallengeSchema = createChallengeSchema.partial();
