import { z } from "zod";

export const createMessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Mess name must be at least 2 characters")
    .max(80, "Mess name must be at most 80 characters"),
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
});

export type CreateMessDto = z.infer<typeof createMessSchema>;
