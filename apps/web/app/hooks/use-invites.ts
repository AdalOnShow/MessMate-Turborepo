"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptInvite,
  getPendingInvites,
  inviteUser,
  rejectInvite,
} from "../actions/invites";

export function usePendingInvites() {
  return useQuery({
    queryKey: ["invites", "pending"],
    queryFn: async () => {
      const result = await getPendingInvites();
      return result;
    },
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useRejectInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    },
  });
}
