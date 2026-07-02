"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMess,
  getMyMess,
  getDefaultMeals,
  updateDefaultMeals,
  getMealTypes,
  type MessInfo,
  type DefaultMealInfo,
  type UpdateDefaultMealsPayload,
  type MealTypeInfo,
} from "../actions/messes";

export function useGetMyMess(enabled = true) {
  return useQuery({
    queryKey: ["my-mess"],
    queryFn: async () => {
      const result = await getMyMess();
      return result;
    },
    enabled,
  });
}

export function useCreateMess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const result = await createMess(payload);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-mess"] });
    },
  });
}

export function useGetDefaultMeals(messId: string | undefined) {
  return useQuery({
    queryKey: ["default-meals", messId],
    queryFn: async () => {
      if (!messId) return [];
      const result = await getDefaultMeals(messId);
      return result;
    },
    enabled: !!messId,
  });
}

export function useGetMealTypes(messId: string | undefined) {
  return useQuery({
    queryKey: ["meal-types", messId],
    queryFn: async () => {
      if (!messId) return [];
      const result = await getMealTypes(messId);
      return result;
    },
    enabled: !!messId,
  });
}

export function useUpdateDefaultMeals(messId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateDefaultMealsPayload) => {
      if (!messId) throw new Error("No mess ID");
      const result = await updateDefaultMeals(messId, payload);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["default-meals", messId] });
    },
  });
}

export { type MessInfo, type DefaultMealInfo, type MealTypeInfo };
