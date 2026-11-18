import { z } from "zod";

export const updateMemberRoleSchema = z.object({
  role: z.enum(["MANAGER", "MEMBER"]),
});

/** Hand the caller's manager role to another active member (roles swap). */
export const handoverManagerSchema = z.object({
  userId: z.string().uuid(),
});

export const memberFiltersSchema = z.object({
  search: z.string().trim().max(100).optional(),
  role: z.enum(["MANAGER", "MEMBER"]).optional(),
  status: z.enum(["ACTIVE", "REMOVED"]).optional(),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type HandoverManagerInput = z.infer<typeof handoverManagerSchema>;
export type MemberFilters = z.infer<typeof memberFiltersSchema>;
