import { z } from "zod";
import { ValidationMessage } from "../../validation/messages";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, ValidationMessage.NAME_MIN)
    .max(80, ValidationMessage.NAME_MAX)
    .optional(),
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

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
