import { z } from "zod";
import { ValidationMessage } from "../../validation/messages";
import { strongPasswordSchema } from "../../validation/password";

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email(ValidationMessage.EMAIL_INVALID),
  password: z.string().min(1, ValidationMessage.PASSWORD_REQUIRED),
});

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, ValidationMessage.NAME_MIN)
    .max(80, ValidationMessage.NAME_MAX),
  email: z.string().trim().toLowerCase().email(ValidationMessage.EMAIL_INVALID),
  password: strongPasswordSchema,
  phone: z
    .union([
      z.string().trim().max(20, ValidationMessage.PHONE_MAX),
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
