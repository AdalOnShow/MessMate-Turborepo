"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDeposits,
  getDepositSummary,
  createDeposit,
  updateDeposit,
  deleteDeposit,
  type DepositInfo,
  type DepositListInfo,
  type DepositSummaryResponseInfo,
  type CreateDepositPayload,
  type UpdateDepositPayload,
} from "../actions/deposits";
import { unwrap } from "../lib/action-result";

export function useGetDeposits(
  messId: string | undefined,
  monthId: string | undefined,
) {
  return useQuery({
    queryKey: ["deposits", messId, monthId],
    queryFn: async (): Promise<DepositListInfo> => {
      if (!messId || !monthId) {
        return { items: [], total: 0, count: 0 };
      }
      return unwrap(getDeposits(messId, monthId));
    },
    enabled: !!messId && !!monthId,
  });
}

export function useDepositSummary(
  messId: string | undefined,
  monthId: string | undefined,
) {
  return useQuery({
    queryKey: ["deposit-summary", messId, monthId],
    queryFn: async (): Promise<DepositSummaryResponseInfo> => {
      if (!messId || !monthId) {
        return { total: 0, count: 0, per_member: [] };
      }
      return unwrap(getDepositSummary(messId, monthId));
    },
    enabled: !!messId && !!monthId,
  });
}

export function useCreateDeposit(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Deposit added" },
    mutationFn: async (payload: CreateDepositPayload) => {
      if (!messId || !monthId) throw new Error("No mess or month ID");
      return unwrap(createDeposit(messId, monthId, payload));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["deposits", messId, monthId],
      });
    },
  });
}

export function useUpdateDeposit(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Deposit updated" },
    mutationFn: async ({
      depositId,
      data,
    }: {
      depositId: string;
      data: UpdateDepositPayload;
    }) => {
      if (!messId) throw new Error("No mess ID");
      return unwrap(updateDeposit(messId, depositId, data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["deposits", messId, monthId],
      });
    },
  });
}

export function useDeleteDeposit(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Deposit deleted" },
    mutationFn: async (depositId: string) => {
      if (!messId) throw new Error("No mess ID");
      return unwrap(deleteDeposit(messId, depositId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["deposits", messId, monthId],
      });
    },
  });
}

export type {
  DepositInfo,
  DepositListInfo,
  DepositSummaryResponseInfo,
  CreateDepositPayload,
  UpdateDepositPayload,
};
