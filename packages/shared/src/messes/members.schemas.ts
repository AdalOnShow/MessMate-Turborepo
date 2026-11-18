import { z } from "zod";

export const updateMemberRoleSchema = z.object({
  role: z.enum(["MANAGER", "MEMBER"]),
});

export const memberFiltersSchema = z.object({
  search: z.string().trim().max(100).optional(),
  role: z.enum(["MANAGER", "MEMBER"]).optional(),
  status: z.enum(["ACTIVE", "REMOVED"]).optional(),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type MemberFilters = z.infer<typeof memberFiltersSchema>;
