"use server";

import { api } from "../lib/api-client";

export interface CreateMessPayload {
  name: string;
  description?: string;
}

export interface UpdateMessPayload {
  name?: string;
  description?: string | null;
  slug?: string;
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
  return api.get<MessInfo | null>("/messes/me");
}

export async function createMess(data: CreateMessPayload) {
  return api.post<MessInfo>("/messes", data);
}

export async function updateMess(messId: string, data: UpdateMessPayload) {
  return api.patch<MessInfo>(`/messes/${messId}`, data);
}

export interface MealTypeInfo {
  id: string;
  mess_id: string;
  name: string;
  value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateMealTypePayload {
  value?: number;
  is_active?: boolean;
}

export async function getMealTypes(messId: string) {
  return api.get<MealTypeInfo[]>(`/messes/${messId}/meal-types`);
}

export async function updateMealType(
  messId: string,
  mealTypeId: string,
  data: UpdateMealTypePayload,
) {
  return api.patch<MealTypeInfo>(
    `/messes/${messId}/meal-types/${mealTypeId}`,
    data,
  );
}
