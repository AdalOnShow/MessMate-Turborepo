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

export interface MemberCalculation {
  member_id: string;
  user_id: string;
  mess_role: "MANAGER" | "MEMBER";
  removed_at: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  total_meals: number;
  meal_cost: number;
  shared_cost: number;
  individual_cost: number;
  deposit_amount: number;
  final_bill: number;
  final_balance: number;
  previous_balance: number;
  current_balance: number;
}

export interface MemberCalculationList {
  month_id: string;
  month_title: string;
  meal_rate: number;
  items: MemberCalculation[];
}
