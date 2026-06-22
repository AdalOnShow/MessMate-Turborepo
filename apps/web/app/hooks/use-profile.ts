"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionStore } from "../store";
import {
  changePassword,
  getProfile,
  updateProfile,
  type UpdateProfilePayload,
} from "../actions/profile";

export function useGetProfile(enabled = true) {
  const setSession = useSessionStore((state) => state.setSession);

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const profile = await getProfile();
      setSession(profile);
      return profile;
    },
    enabled,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation({
    mutationFn: (data: UpdateProfilePayload) => updateProfile(data),
    onSuccess: (profile) => {
      setSession(profile);
      queryClient.setQueryData(["profile"], profile);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => changePassword(currentPassword, newPassword),
  });
}
