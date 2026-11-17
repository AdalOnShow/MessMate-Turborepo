"use client";

import { getExpenseSummary, getExpenses } from "../lib/reads";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  type ExpenseInfo,
  type ExpenseListInfo,
  type ExpenseSummaryResponseInfo,
  type CreateExpensePayload,
  type UpdateExpensePayload,
} from "../actions/expenses";
import { unwrap } from "../lib/action-result";

export function useGetExpenses(
  messId: string | undefined,
  monthId: string | undefined,
) {
  return useQuery({
    queryKey: ["expenses", messId, monthId],
    queryFn: async (): Promise<ExpenseListInfo> => {
      if (!messId || !monthId) {
        return {
          items: [],
          summary: {
            total: 0,
            shared_total: 0,
            individual_total: 0,
            bazaar_total: 0,
            count: 0,
          },
        };
      }
      return unwrap(getExpenses(messId, monthId));
    },
    enabled: !!messId && !!monthId,
  });
}

export function useExpenseSummary(
  messId: string | undefined,
  monthId: string | undefined,
) {
  return useQuery({
    queryKey: ["expense-summary", messId, monthId],
    queryFn: async (): Promise<ExpenseSummaryResponseInfo> => {
      if (!messId || !monthId) {
        return {
          total: 0,
          shared_total: 0,
          individual_total: 0,
          bazaar_total: 0,
          count: 0,
          per_member: [],
        };
      }
      return unwrap(getExpenseSummary(messId, monthId));
    },
    enabled: !!messId && !!monthId,
  });
}

export function useCreateExpense(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "expenseAdded" },
    mutationFn: async (payload: CreateExpensePayload) => {
      if (!messId || !monthId) throw new Error("No mess or month ID");
      return unwrap(createExpense(messId, monthId, payload));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expenses", messId, monthId],
      });
    },
  });
}

export function useUpdateExpense(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "expenseUpdated" },
    mutationFn: async ({
      expenseId,
      data,
    }: {
      expenseId: string;
      data: UpdateExpensePayload;
    }) => {
      if (!messId) throw new Error("No mess ID");
      return unwrap(updateExpense(messId, expenseId, data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expenses", messId, monthId],
      });
    },
  });
}

export function useDeleteExpense(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "expenseDeleted" },
    mutationFn: async (expenseId: string) => {
      if (!messId) throw new Error("No mess ID");
      return unwrap(deleteExpense(messId, expenseId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expenses", messId, monthId],
      });
    },
  });
}

export type {
  ExpenseInfo,
  ExpenseListInfo,
  ExpenseSummaryResponseInfo,
  CreateExpensePayload,
  UpdateExpensePayload,
};
