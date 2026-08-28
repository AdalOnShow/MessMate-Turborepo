"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  type ExpenseInfo,
  type ExpenseListInfo,
  type CreateExpensePayload,
  type UpdateExpensePayload,
} from "../actions/expenses";

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
      return getExpenses(messId, monthId);
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
    mutationFn: async (payload: CreateExpensePayload) => {
      if (!messId || !monthId) throw new Error("No mess or month ID");
      return createExpense(messId, monthId, payload);
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
    mutationFn: async ({
      expenseId,
      data,
    }: {
      expenseId: string;
      data: UpdateExpensePayload;
    }) => {
      if (!messId) throw new Error("No mess ID");
      return updateExpense(messId, expenseId, data);
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
    mutationFn: async (expenseId: string) => {
      if (!messId) throw new Error("No mess ID");
      return deleteExpense(messId, expenseId);
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
  CreateExpensePayload,
  UpdateExpensePayload,
};
