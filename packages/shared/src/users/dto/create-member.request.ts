import { z } from "zod";
import { ValidationMessage } from "../../validation/messages";
import { strongPasswordSchema } from "../../validation/password";

export const createMemberSchema = z.object({
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
  messId: z.string().uuid(ValidationMessage.MESS_ID_INVALID),
});

export type CreateMemberRequest = z.infer<typeof createMemberSchema>;
