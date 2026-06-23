import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z.object({
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
});

export type SignInDto = z.infer<typeof signInSchema>;
export type SignupDto = z.infer<typeof signUpSchema>;

export function formatZodError(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}
