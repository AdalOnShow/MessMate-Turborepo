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

export interface DefaultMealInfo {
  id: string;
  mess_id: string;
  meal_type_id: string;
  meal_value: number;
  created_at: string;
  meal_type: {
    id: string;
    name: string;
    value: number;
    is_active: boolean;
  };
}

export interface UpdateDefaultMealsPayload {
  meals: {
    mealTypeId: string;
    mealValue: number;
  }[];
}

export async function getMyMess() {
  return api.get<MessInfo | null>("/messes/me");
}

export async function createMess(data: CreateMessPayload) {
  return api.post<MessInfo>("/messes", data);
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

export async function getMealTypes(messId: string) {
  return api.get<MealTypeInfo[]>(`/messes/${messId}/meal-types`);
}

export async function getDefaultMeals(messId: string) {
  return api.get<DefaultMealInfo[]>(`/messes/${messId}/default-meals`);
}

export async function updateDefaultMeals(
  messId: string,
  data: UpdateDefaultMealsPayload,
) {
  return api.put<DefaultMealInfo[]>(`/messes/${messId}/default-meals`, data);
}
