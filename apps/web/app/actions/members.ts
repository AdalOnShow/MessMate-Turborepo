"use server";

import { api } from "../lib/api-client";
import type { ActivityLog, MemberDashboard, MessDashboard } from "@repo/shared";

export interface MemberUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface MemberData {
  id: string;
  mess_id: string;
  user_id: string;
  mess_role: "MANAGER" | "MEMBER";
  joined_at: string;
  removed_at: string | null;
  user: MemberUser;
}

export interface MemberCalculationInfo {
  member_id: string;
  user_id: string;
  mess_role: "MANAGER" | "MEMBER";
  removed_at: string | null;
  user: MemberUser;
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

export interface MemberCalculationListInfo {
  month_id: string;
  month_title: string;
  meal_rate: number;
  items: MemberCalculationInfo[];
}

export type MessDashboardInfo = MessDashboard;
export type MemberDashboardInfo = MemberDashboard;
export type ActivityAction = ActivityLog["action"];
export type ActivityLogInfo = ActivityLog;

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  manager_created: boolean;
  email_verified: boolean;
}

export async function removeMember(messId: string, userId: string) {
  return api.delete<{ success: boolean; message: string }>(
    `/messes/${messId}/members/${userId}`,
  );
}

export async function updateMemberRole(
  messId: string,
  userId: string,
  role: "MANAGER" | "MEMBER",
) {
  return api.patch<MemberData>(`/messes/${messId}/members/${userId}/role`, {
    role,
  });
}

export async function createMemberAccount(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  messId: string;
}) {
  return api.post<UserSearchResult>("/users/create-member", data);
}
