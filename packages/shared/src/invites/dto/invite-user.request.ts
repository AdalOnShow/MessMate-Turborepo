import { z } from "zod";

export const inviteUserSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export type InviteUserRequest = z.infer<typeof inviteUserSchema>;
