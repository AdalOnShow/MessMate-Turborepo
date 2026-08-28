"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMember,
  getMembers,
  getMemberCalculations,
  removeMember,
  searchUsers,
  updateMemberRole,
  type MemberData,
  type MemberCalculationListInfo,
  type UserSearchResult,
} from "../actions/members";
import { useDebounce } from "./use-debounce";

export interface MemberFilters {
  search?: string;
  role?: "MANAGER" | "MEMBER";
  status?: "ACTIVE" | "REMOVED";
}

export function useMembers(
  messId: string | undefined,
  filters?: MemberFilters,
) {
  return useQuery({
    queryKey: ["members", messId, filters],
    queryFn: async () => {
      if (!messId) return [];
      const result = await getMembers(messId, filters);
      return result;
    },
    enabled: !!messId,
  });
}

export function useMemberCalculations(messId: string | undefined) {
  return useQuery({
    queryKey: ["member-calculations", messId],
    queryFn: async () => {
      if (!messId) return null;
      const result = await getMemberCalculations(messId);
      return result;
    },
    enabled: !!messId,
  });
}

export function useAddMember(messId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await addMember(messId, userId);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", messId] });
      queryClient.invalidateQueries({
        queryKey: ["member-calculations", messId],
      });
    },
  });
}

export function useRemoveMember(messId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await removeMember(messId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", messId] });
      queryClient.invalidateQueries({
        queryKey: ["member-calculations", messId],
      });
    },
  });
}

export function useUpdateMemberRole(messId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "MANAGER" | "MEMBER";
    }) => {
      const result = await updateMemberRole(messId, userId, role);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", messId] });
      queryClient.invalidateQueries({
        queryKey: ["member-calculations", messId],
      });
    },
  });
}

export function useSearchUsers(query: string) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ["users", "search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const result = await searchUsers(debouncedQuery);
      return result;
    },
    enabled: debouncedQuery.length >= 2,
    retry: false,
  });
}

export {
  type MemberData,
  type UserSearchResult,
  type MemberCalculationListInfo,
};
