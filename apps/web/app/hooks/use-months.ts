"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getActiveMonth,
  createMonth,
  getMonthHistory,
  getMonthSummary,
  type MonthInfo,
  type MonthSummaryInfo,
  type CreateMonthPayload,
} from "../actions/months";
import { unwrap } from "../lib/action-result";

export function useGetActiveMonth(messId: string | undefined) {
  return useQuery({
    queryKey: ["active-month", messId],
    queryFn: async () => {
      if (!messId) return null;
      const result = await unwrap(getActiveMonth(messId));
      return result;
    },
    enabled: !!messId,
  });
}

export function useCreateMonth(messId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateMonthPayload) => {
      if (!messId) throw new Error("No mess ID");
      const result = await unwrap(createMonth(messId, payload));
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-month", messId] });
      queryClient.invalidateQueries({ queryKey: ["month-history", messId] });
    },
  });
}

export function useGetMonthHistory(messId: string | undefined) {
  return useQuery({
    queryKey: ["month-history", messId],
    queryFn: async () => {
      if (!messId) return [];
      const result = await unwrap(getMonthHistory(messId));
      return result;
    },
    enabled: !!messId,
  });
}

export function useGetMonthSummary(
  messId: string | undefined,
  monthId: string | undefined,
) {
  return useQuery({
    queryKey: ["month-summary", messId, monthId],
    queryFn: async () => {
      if (!messId || !monthId) return null;
      const result = await unwrap(getMonthSummary(messId, monthId));
      return result;
    },
    enabled: !!messId && !!monthId,
  });
}

export type { MonthInfo, MonthSummaryInfo, CreateMonthPayload };
