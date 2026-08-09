import { z } from "zod";

export const createMemberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be at most 80 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters"),
  phone: z
    .union([
      z.string().trim().max(20, "Phone number must be at most 20 characters"),
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
  messId: z.string().uuid("Invalid mess ID"),
});

export type CreateMemberRequest = z.infer<typeof createMemberSchema>;
