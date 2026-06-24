"use server";

import { api } from "../lib/api-client";

export interface CreateMessPayload {
  name: string;
  description?: string;
}

export interface MessInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
  current_user_role: string;
  member_id: string;
}

export async function getMyMess() {
  return api.get<{ success: boolean; data: MessInfo | null }>("/messes/me");
}

export async function createMess(data: CreateMessPayload) {
  return api.post<{ success: boolean; data: MessInfo }>("/messes", data);
}
