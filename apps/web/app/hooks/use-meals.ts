"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkSaveMealEntries,
  getMealEntries,
  deleteMealEntry,
  type MealEntryInfo,
  type BulkMealEntriesPayload,
} from "../actions/meals";

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
      const result = await getMealEntries(messId, monthId, startDate, endDate);
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
    mutationFn: async (payload: BulkMealEntriesPayload) => {
      if (!messId || !monthId) throw new Error("No mess or month ID");
      const result = await bulkSaveMealEntries(messId, monthId, payload);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-entries"] });
    },
  });
}

export function useDeleteMealEntry(messId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      if (!messId) throw new Error("No mess ID");
      const result = await deleteMealEntry(messId, entryId);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-entries"] });
    },
  });
}

export type { MealEntryInfo, BulkMealEntriesPayload };
