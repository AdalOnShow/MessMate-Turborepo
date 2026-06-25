import type { z } from "zod";
import type {
  addMemberSchema,
  updateMemberRoleSchema,
  memberFiltersSchema,
} from "./members.schemas";

export type AddMemberDto = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleDto = z.infer<typeof updateMemberRoleSchema>;
export type MemberFiltersDto = z.infer<typeof memberFiltersSchema>;

export interface MessMemberWithUser {
  id: string;
  mess_id: string;
  user_id: string;
  mess_role: "MANAGER" | "MEMBER";
  joined_at: string;
  removed_at: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}
