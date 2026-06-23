"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionStore } from "../store";
import {
  changePassword,
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
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

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      return uploadAvatar(formData);
    },
    onSuccess: (profile) => {
      setSession(profile);
      queryClient.setQueryData(["profile"], profile);
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation({
    mutationFn: () => deleteAvatar(),
    onSuccess: (profile) => {
      setSession(profile);
      queryClient.setQueryData(["profile"], profile);
    },
  });
}
