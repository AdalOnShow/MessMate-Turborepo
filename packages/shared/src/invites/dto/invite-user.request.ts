import { z } from "zod";
import { ValidationMessage } from "../../validation/messages";

/** Invite by the id picked from search results, or by a typed email. */
export const inviteUserSchema = z
  .object({
    userId: z.string().uuid().optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email(ValidationMessage.EMAIL_INVALID)
      .optional(),
  })
  .refine((v) => Boolean(v.userId) !== Boolean(v.email), {
    message: ValidationMessage.INVITE_TARGET_REQUIRED,
    path: ["email"],
  });

export type InviteUserRequest = z.infer<typeof inviteUserSchema>;
