"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMember,
  getMembers,
  removeMember,
  searchUsers,
  updateMemberRole,
  type MemberData,
  type UserSearchResult,
} from "../actions/members";

export interface MemberFilters {
  search?: string;
  role?: "MANAGER" | "MEMBER";
  status?: "ACTIVE" | "REMOVED";
}

export function useMembers(messId: string | undefined, filters?: MemberFilters) {
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

export function useAddMember(messId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await addMember(messId, userId);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", messId] });
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
    },
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ["users", "search", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const result = await searchUsers(query);
      return result;
    },
    enabled: query.length >= 2,
    retry: false,
  });
}

export { type MemberData, type UserSearchResult };
