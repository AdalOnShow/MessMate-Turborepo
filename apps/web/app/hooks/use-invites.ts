"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptInvite,
  getPendingInvites,
  inviteUser,
  rejectInvite,
} from "../actions/invites";
import { unwrap } from "../lib/action-result";

export function usePendingInvites() {
  return useQuery({
    queryKey: ["invites", "pending"],
    queryFn: async () => {
      const result = await unwrap(getPendingInvites());
      return result;
    },
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) => unwrap(inviteUser(email)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => unwrap(acceptInvite(inviteId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useRejectInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => unwrap(rejectInvite(inviteId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    },
  });
}
