"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMess,
  getMyMess,
  updateMess,
  getMealTypes,
  updateMealType,
  type MessInfo,
  type MealTypeInfo,
  type UpdateMessPayload,
  type UpdateMealTypePayload,
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

export function useUpdateMess(messId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateMessPayload) => {
      if (!messId) throw new Error("No mess ID");
      const result = await updateMess(messId, payload);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-mess"] });
    },
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

export function useUpdateMealType(messId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mealTypeId,
      data,
    }: {
      mealTypeId: string;
      data: UpdateMealTypePayload;
    }) => {
      if (!messId) throw new Error("No mess ID");
      const result = await updateMealType(messId, mealTypeId, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-types", messId] });
    },
  });
}

export {
  type MessInfo,
  type MealTypeInfo,
  type UpdateMessPayload,
  type UpdateMealTypePayload,
};
