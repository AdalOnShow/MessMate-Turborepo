"use server";

import { api } from "../lib/api-client";

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

export interface MessDashboardInfo {
  month_id: string;
  month_title: string;
  meal_rate: number;
  total_members: number;
  total_meals: number;
  total_deposits: number;
  total_expenses: number;
  total_bill: number;
  total_balance: number;
}

export type ActivityAction =
  | "MEMBER_ADDED"
  | "MEMBER_REMOVED"
  | "MANAGER_ASSIGNED"
  | "MEAL_ADDED"
  | "MEAL_UPDATED"
  | "MEAL_DELETED"
  | "EXPENSE_ADDED"
  | "EXPENSE_UPDATED"
  | "EXPENSE_DELETED"
  | "DEPOSIT_ADDED"
  | "DEPOSIT_UPDATED"
  | "MONTH_OPENED"
  | "MONTH_CLOSED"
  | "MEMBER_BALANCE_CREATED"
  | "DEFAULT_MEALS_UPDATED"
  | "BAZAAR_SUBMITTED"
  | "BAZAAR_UPDATED"
  | "BAZAAR_APPROVED"
  | "BAZAAR_REJECTED";

export interface ActivityLogInfo {
  id: string;
  action: ActivityAction;
  created_at: string;
  actor: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  manager_created: boolean;
  email_verified: boolean;
}

export async function getMembers(
  messId: string,
  filters?: { search?: string; role?: string; status?: string },
) {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.role) params.set("role", filters.role);
  if (filters?.status) params.set("status", filters.status);

  const query = params.toString();
  const path = `/messes/${messId}/members${query ? `?${query}` : ""}`;

  return api.get<MemberData[]>(path);
}

export async function getMemberCalculations(messId: string) {
  return api.get<MemberCalculationListInfo>(
    `/messes/${messId}/members/calculations`,
  );
}

export async function getMessDashboard(messId: string) {
  return api.get<MessDashboardInfo>(`/messes/${messId}/dashboard`);
}

export async function getRecentActivities(messId: string) {
  return api.get<ActivityLogInfo[]>(`/messes/${messId}/activities`);
}

export async function addMember(messId: string, userId: string) {
  return api.post<MemberData>(`/messes/${messId}/members`, { userId });
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

export async function searchUsers(query: string) {
  return api.get<UserSearchResult[]>(
    `/users/search?q=${encodeURIComponent(query)}`,
  );
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
