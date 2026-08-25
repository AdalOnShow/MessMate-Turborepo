"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkSaveMealEntries,
  getMealEntries,
  deleteMealEntry,
  getDailyMealReport,
  getMemberMealReport,
  getMonthMealSummary,
  type MealEntryInfo,
  type BulkMealEntriesPayload,
  type DailyMealReport,
  type MemberMealReport,
  type MonthMealSummary,
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

export function useGetDailyMealReport(
  messId: string | undefined,
  monthId: string | undefined,
  date: string,
) {
  return useQuery({
    queryKey: ["meal-daily-report", messId, monthId, date],
    queryFn: async () => {
      if (!messId || !monthId || !date) return null;
      return getDailyMealReport(messId, monthId, date);
    },
    enabled: !!messId && !!monthId && !!date,
  });
}

export function useGetMemberMealReport(
  messId: string | undefined,
  monthId: string | undefined,
  memberId: string | undefined,
) {
  return useQuery({
    queryKey: ["meal-member-report", messId, monthId, memberId],
    queryFn: async () => {
      if (!messId || !monthId || !memberId) return null;
      return getMemberMealReport(messId, monthId, memberId);
    },
    enabled: !!messId && !!monthId && !!memberId,
  });
}

export function useGetMonthMealSummary(
  messId: string | undefined,
  monthId: string | undefined,
) {
  return useQuery({
    queryKey: ["meal-month-summary", messId, monthId],
    queryFn: async () => {
      if (!messId || !monthId) return null;
      return getMonthMealSummary(messId, monthId);
    },
    enabled: !!messId && !!monthId,
  });
}

export type { DailyMealReport, MemberMealReport, MonthMealSummary };
