"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  submitBazaar,
  getBazaarHistory,
  updateBazaar,
  deleteBazaar,
  approveBazaar,
  rejectBazaar,
  type BazaarSubmissionInfo,
  type BazaarHistoryInfo,
  type BazaarItemInfo,
  type CreateBazaarPayload,
  type UpdateBazaarPayload,
} from "../actions/bazaar";

export function useGetBazaarHistory(
  messId: string | undefined,
  monthId: string | undefined,
) {
  return useQuery({
    queryKey: ["bazaar-history", messId, monthId],
    queryFn: async () => {
      if (!messId || !monthId)
        return { pending: [], approved: [], rejected: [] };
      return getBazaarHistory(messId, monthId);
    },
    enabled: !!messId && !!monthId,
  });
}

export function useSubmitBazaar(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBazaarPayload) => {
      if (!messId || !monthId) throw new Error("No mess or month ID");
      return submitBazaar(messId, monthId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bazaar-history", messId, monthId],
      });
    },
  });
}

export function useUpdateBazaar(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      data,
    }: {
      submissionId: string;
      data: UpdateBazaarPayload;
    }) => {
      if (!messId) throw new Error("No mess ID");
      return updateBazaar(messId, submissionId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bazaar-history", messId, monthId],
      });
    },
  });
}

export function useDeleteBazaar(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      if (!messId) throw new Error("No mess ID");
      return deleteBazaar(messId, submissionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bazaar-history", messId, monthId],
      });
    },
  });
}

export function useApproveBazaar(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      if (!messId) throw new Error("No mess ID");
      return approveBazaar(messId, submissionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bazaar-history", messId, monthId],
      });
      queryClient.invalidateQueries({ queryKey: ["month-summary"] });
    },
  });
}

export function useRejectBazaar(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      if (!messId) throw new Error("No mess ID");
      return rejectBazaar(messId, submissionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bazaar-history", messId, monthId],
      });
    },
  });
}

export type {
  BazaarSubmissionInfo,
  BazaarHistoryInfo,
  BazaarItemInfo,
  CreateBazaarPayload,
  UpdateBazaarPayload,
};
