import { z } from "zod";
import { ValidationMessage } from "../../validation/messages";
import { strongPasswordSchema } from "../../validation/password";

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, ValidationMessage.CURRENT_PASSWORD_REQUIRED),
    newPassword: strongPasswordSchema,
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: ValidationMessage.PASSWORD_SAME_AS_CURRENT,
    path: ["newPassword"],
  });

export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
