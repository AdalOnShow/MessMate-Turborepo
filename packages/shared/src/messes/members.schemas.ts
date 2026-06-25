import { z } from "zod";

export const addMemberSchema = z.object({
  userId: z.string().uuid(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["MANAGER", "MEMBER"]),
});

export const memberFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(["MANAGER", "MEMBER"]).optional(),
  status: z.enum(["ACTIVE", "REMOVED"]).optional(),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type MemberFilters = z.infer<typeof memberFiltersSchema>;
