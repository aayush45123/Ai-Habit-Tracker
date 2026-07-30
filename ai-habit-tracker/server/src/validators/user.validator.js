import { z } from "zod";

export const aiRecommendationSchema = z.object({
  currentStreak: z.coerce
    .number({ invalid_type_error: "Current streak must be a number" })
    .min(0, "Current streak must be zero or positive"),
  goal: z
    .string({ required_error: "Goal is required" })
    .trim()
    .min(1, "Goal is required"),
  completedHabits: z
    .union([z.coerce.number(), z.array(z.string()), z.array(z.object({}))])
    .optional(),
  mood: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name cannot exceed 50 characters")
    .optional(),
  email: z.string().email("Invalid email address").optional(),
  profileImage: z.string().optional(),
});
