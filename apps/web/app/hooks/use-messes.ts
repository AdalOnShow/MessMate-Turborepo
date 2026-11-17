"use client";

import { getMealTypes, getMyMess } from "../lib/reads";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMess,
  updateMess,
  createMealType,
  updateMealType,
  deleteMealType,
  type MessInfo,
  type MealTypeInfo,
  type UpdateMessPayload,
  type CreateMealTypePayload,
  type UpdateMealTypePayload,
} from "../actions/messes";
import { unwrap } from "../lib/action-result";

export function useGetMyMess(enabled = true) {
  return useQuery({
    queryKey: ["my-mess"],
    queryFn: async () => {
      const result = await unwrap(getMyMess());
      return result;
    },
    enabled,
  });
}

export function useCreateMess() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "messCreated" },
    mutationFn: async (payload: { name: string; description?: string }) => {
      const result = await unwrap(createMess(payload));
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
    meta: { successMessage: "messSettingsSaved" },
    mutationFn: async (payload: UpdateMessPayload) => {
      if (!messId) throw new Error("No mess ID");
      const result = await unwrap(updateMess(messId, payload));
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
      const result = await unwrap(getMealTypes(messId));
      return result;
    },
    enabled: !!messId,
  });
}

export function useUpdateMealType(messId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "mealTypeUpdated" },
    mutationFn: async ({
      mealTypeId,
      data,
    }: {
      mealTypeId: string;
      data: UpdateMealTypePayload;
    }) => {
      if (!messId) throw new Error("No mess ID");
      const result = await unwrap(updateMealType(messId, mealTypeId, data));
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-types", messId] });
    },
  });
}

export function useCreateMealType(messId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "mealTypeAdded" },
    mutationFn: async (payload: CreateMealTypePayload) => {
      if (!messId) throw new Error("No mess ID");
      const result = await unwrap(createMealType(messId, payload));
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-types", messId] });
    },
  });
}

export function useDeleteMealType(messId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "mealTypeDeleted" },
    mutationFn: async (mealTypeId: string) => {
      if (!messId) throw new Error("No mess ID");
      const result = await unwrap(deleteMealType(messId, mealTypeId));
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
  type CreateMealTypePayload,
  type UpdateMealTypePayload,
};
