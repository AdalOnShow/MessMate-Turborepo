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

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  phone: string | null;
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

  return api.get<{ success: boolean; data: MemberData[] }>(path);
}

export async function addMember(messId: string, userId: string) {
  return api.post<{ success: boolean; data: MemberData }>(
    `/messes/${messId}/members`,
    { userId },
  );
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
  return api.patch<{ success: boolean; data: MemberData }>(
    `/messes/${messId}/members/${userId}/role`,
    { role },
  );
}

export async function searchUsers(query: string) {
  return api.get<{ success: boolean; data: UserSearchResult[] }>(
    `/users/search?q=${encodeURIComponent(query)}`,
  );
}
