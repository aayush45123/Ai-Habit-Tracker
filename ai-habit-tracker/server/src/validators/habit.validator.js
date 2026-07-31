import { z } from "zod";

export const createHabitSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters")
    .refine((val) => isNaN(Number(val)), {
      message: "Title cannot be numeric",
    }),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "custom"], {
    errorMap: () => ({ message: "Frequency must be daily, weekly, monthly, or custom" }),
  }),
  category: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

export const updateHabitSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty")
    .max(100, "Title cannot exceed 100 characters")
    .refine((val) => isNaN(Number(val)), {
      message: "Title cannot be numeric",
    })
    .optional(),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "custom"]).optional(),
  category: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  status: z.enum(["active", "archived", "completed"]).optional(),
});

export const logHabitSchema = z.object({
  status: z.enum(["done", "completed", "missed"], {
    errorMap: () => ({ message: "Status must be 'done', 'completed', or 'missed'" }),
  }),
  date: z.string().optional(),
  notes: z.string().optional(),
});
