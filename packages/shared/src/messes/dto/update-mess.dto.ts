import { z } from "zod";

export const updateMessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be at most 80 characters")
    .optional(),
  description: z
    .union([
      z.string().trim().max(300, "Description must be at most 300 characters"),
      z.literal(""),
      z.null(),
    ])
    .optional()
    .transform((value) => {
      if (value === "" || value == null) {
        return undefined;
      }
      return value;
    }),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(80, "Slug must be at most 80 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    )
    .optional(),
});

export type UpdateMessDto = z.infer<typeof updateMessSchema>;
