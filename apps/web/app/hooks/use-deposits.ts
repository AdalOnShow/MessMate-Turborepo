"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDeposits,
  createDeposit,
  updateDeposit,
  deleteDeposit,
  type DepositInfo,
  type DepositListInfo,
  type CreateDepositPayload,
  type UpdateDepositPayload,
} from "../actions/deposits";

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
      return getDeposits(messId, monthId);
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
    mutationFn: async (payload: CreateDepositPayload) => {
      if (!messId || !monthId) throw new Error("No mess or month ID");
      return createDeposit(messId, monthId, payload);
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
    mutationFn: async ({
      depositId,
      data,
    }: {
      depositId: string;
      data: UpdateDepositPayload;
    }) => {
      if (!messId) throw new Error("No mess ID");
      return updateDeposit(messId, depositId, data);
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
    mutationFn: async (depositId: string) => {
      if (!messId) throw new Error("No mess ID");
      return deleteDeposit(messId, depositId);
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
  CreateDepositPayload,
  UpdateDepositPayload,
};
