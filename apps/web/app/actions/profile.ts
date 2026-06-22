"use server";

import { cookies } from "next/headers";
import type { ProfileUser } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type UpdateProfilePayload = {
  name?: string;
  phone?: string | null;
};

async function getAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get?.("access_token")?.value ?? null;
}

async function requestProfileApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  const json = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(json.message || `API Error: ${response.status}`);
  }

  return json.data;
}

export async function getProfile() {
  return requestProfileApi<ProfileUser>("/users/me");
}

export async function updateProfile(data: UpdateProfilePayload) {
  return requestProfileApi<ProfileUser>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  return requestProfileApi<{ success: true }>("/users/me/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
