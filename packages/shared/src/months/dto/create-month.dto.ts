import { z } from "zod";

export const createMonthSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty")
    .max(100, "Title must be at most 100 characters")
    .optional(),
});

export type CreateMonthDto = z.infer<typeof createMonthSchema>;
