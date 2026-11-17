"use client";

import { getProfile } from "../lib/reads";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionStore } from "../store";
import {
  changePassword,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  type UpdateProfilePayload,
} from "../actions/profile";
import { unwrap } from "../lib/action-result";

export function useGetProfile(enabled = true) {
  const setSession = useSessionStore((state) => state.setSession);

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const profile = await unwrap(getProfile());
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
    meta: { successMessage: "profileUpdated" },
    mutationFn: (data: UpdateProfilePayload) => unwrap(updateProfile(data)),
    onSuccess: (profile) => {
      setSession(profile);
      queryClient.setQueryData(["profile"], profile);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    meta: { successMessage: "passwordChanged" },
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => unwrap(changePassword(currentPassword, newPassword)),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation({
    meta: { successMessage: "profilePhotoUpdated" },
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      return unwrap(uploadAvatar(formData));
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
    meta: { successMessage: "profilePhotoRemoved" },
    mutationFn: () => unwrap(deleteAvatar()),
    onSuccess: (profile) => {
      setSession(profile);
      queryClient.setQueryData(["profile"], profile);
    },
  });
}
