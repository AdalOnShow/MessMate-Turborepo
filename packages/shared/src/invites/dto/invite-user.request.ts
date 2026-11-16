import { z } from "zod";

/** Invite by the id picked from search results, or by a typed email. */
export const inviteUserSchema = z
  .object({
    userId: z.string().uuid().optional(),
    email: z.string().trim().email("Enter a valid email address").optional(),
  })
  .refine((v) => Boolean(v.userId) !== Boolean(v.email), {
    message: "Provide either a user or an email address",
    path: ["email"],
  });

export type InviteUserRequest = z.infer<typeof inviteUserSchema>;
