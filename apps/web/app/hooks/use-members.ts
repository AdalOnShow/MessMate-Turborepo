"use client";

import {
  getMemberCalculations,
  getMemberDashboard,
  getMembers,
  getMessDashboard,
  getRecentActivities,
  searchUsers,
} from "../lib/reads";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  handoverManager,
  removeMember,
  updateMemberRole,
  type ActivityLogInfo,
  type MemberData,
  type MemberCalculationListInfo,
  type MessDashboardInfo,
  type MemberDashboardInfo,
  type UserSearchResult,
} from "../actions/members";
import { unwrap } from "../lib/action-result";
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
      const result = await unwrap(getMembers(messId, filters));
      return result;
    },
    enabled: !!messId,
    // Keep the current list on screen while a new search/filter loads.
    placeholderData: keepPreviousData,
  });
}

export function useMemberCalculations(messId: string | undefined) {
  return useQuery({
    queryKey: ["member-calculations", messId],
    queryFn: async () => {
      if (!messId) return null;
      const result = await unwrap(getMemberCalculations(messId));
      return result;
    },
    enabled: !!messId,
  });
}

export function useMessDashboard(messId: string | undefined) {
  return useQuery({
    queryKey: ["mess-dashboard", messId],
    queryFn: async () => {
      if (!messId) return null;
      const result = await unwrap(getMessDashboard(messId));
      return result;
    },
    enabled: !!messId,
  });
}

export function useRecentActivities(messId: string | undefined) {
  return useQuery({
    queryKey: ["mess-activities", messId],
    queryFn: async () => {
      if (!messId) return [];
      const result = await unwrap(getRecentActivities(messId));
      return result;
    },
    enabled: !!messId,
  });
}

export function useMemberDashboard(messId: string | undefined) {
  return useQuery({
    queryKey: ["member-dashboard", messId],
    queryFn: async () => {
      if (!messId) return null;
      const result = await unwrap(getMemberDashboard(messId));
      return result;
    },
    enabled: !!messId,
  });
}

export function useRemoveMember(messId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "memberRemoved" },
    mutationFn: async (userId: string) => {
      await unwrap(removeMember(messId, userId));
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
    meta: { successMessage: "memberRoleUpdated" },
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "MANAGER" | "MEMBER";
    }) => {
      const result = await unwrap(updateMemberRole(messId, userId, role));
      return result;
    },
    // A role change can be the caller's own (stepping down), which changes
    // what every page shows, so refetch everything.
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

/** Hand the caller's manager role to another member; the caller becomes a member. */
export function useHandoverManager(messId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "managerHandedOver" },
    mutationFn: (userId: string) => unwrap(handoverManager(messId, userId)),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useSearchUsers(query: string) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ["users", "search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 3) return [];
      const result = await unwrap(searchUsers(debouncedQuery));
      return result;
    },
    enabled: debouncedQuery.trim().length >= 3,
    retry: false,
  });
}

export {
  type MemberData,
  type UserSearchResult,
  type MemberCalculationListInfo,
  type MessDashboardInfo,
  type MemberDashboardInfo,
  type ActivityLogInfo,
};
