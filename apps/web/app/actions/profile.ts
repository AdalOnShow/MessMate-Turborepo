"use server";

import { api } from "../lib/api-client";
import type { ProfileUser } from "./auth";

export type UpdateProfilePayload = {
  name?: string;
  phone?: string | null;
};

export async function getProfile() {
  return api.get<ProfileUser>("/users/me");
}

export async function updateProfile(data: UpdateProfilePayload) {
  return api.patch<ProfileUser>("/users/me", data);
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  return api.patch<{ success: true }>("/users/me/password", {
    currentPassword,
    newPassword,
  });
}

export async function uploadAvatar(formData: FormData) {
  return api.postFormData<ProfileUser>("/users/me/avatar", formData);
}

export async function deleteAvatar() {
  return api.delete<ProfileUser>("/users/me/avatar");
}
