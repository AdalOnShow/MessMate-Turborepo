"use client";

import { getMealEntries, getMonthMealSummary } from "../lib/reads";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkSaveMealEntries,
  deleteMealEntry,
  updateMealDay,
  type MealEntryInfo,
  type BulkMealEntriesPayload,
  type MonthMealSummary,
} from "../actions/meals";
import { unwrap } from "../lib/action-result";

export function useGetMealEntries(
  messId: string | undefined,
  monthId: string | undefined,
  startDate: string,
  endDate: string,
) {
  return useQuery({
    queryKey: ["meal-entries", messId, monthId, startDate, endDate],
    queryFn: async () => {
      if (!messId || !monthId) return [];
      const result = await unwrap(
        getMealEntries(messId, monthId, startDate, endDate),
      );
      return result;
    },
    enabled: !!messId && !!monthId,
  });
}

export function useBulkSaveMealEntries(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    // No toast: the page shows a SuccessDialog with what was saved.
    mutationFn: async (payload: BulkMealEntriesPayload) => {
      if (!messId || !monthId) throw new Error("No mess or month ID");
      const result = await unwrap(
        bulkSaveMealEntries(messId, monthId, payload),
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-entries"] });
    },
  });
}

export function useUpdateMealDay(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "mealsUpdated" },
    mutationFn: async (payload: BulkMealEntriesPayload) => {
      if (!messId || !monthId) throw new Error("No mess or month ID");
      return unwrap(updateMealDay(messId, monthId, payload));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-entries"] });
    },
  });
}

export function useDeleteMealEntry(messId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "mealEntryDeleted" },
    mutationFn: async (entryId: string) => {
      if (!messId) throw new Error("No mess ID");
      const result = await unwrap(deleteMealEntry(messId, entryId));
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-entries"] });
    },
  });
}

export type { MealEntryInfo, BulkMealEntriesPayload };

export function useGetMonthMealSummary(
  messId: string | undefined,
  monthId: string | undefined,
) {
  return useQuery({
    queryKey: ["meal-month-summary", messId, monthId],
    queryFn: async () => {
      if (!messId || !monthId) return null;
      return unwrap(getMonthMealSummary(messId, monthId));
    },
    enabled: !!messId && !!monthId,
  });
}

export type { MonthMealSummary };
