"use client";

/**
 * Client-side API utilities for avatar operations.
 * These run in the browser (not as Server Actions) because they need
 * to send multipart/form-data directly.
 */

import type { ProfileUser } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

function getAccessTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("access_token="));
  return match ? (match.split("=")[1] ?? null) : null;
}

async function clientFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const accessToken = getAccessTokenFromCookie();
  if (!accessToken) throw new Error("Not authenticated");

  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
    ...(options.headers ?? {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const json = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(json.message || `API Error: ${response.status}`);
  }

  return json.data;
}

/**
 * Upload an avatar file to the API.
 * Uses FormData + multipart — Content-Type is intentionally NOT set
 * so the browser sets the correct boundary automatically.
 */
export async function uploadAvatarClientApi(file: File): Promise<ProfileUser> {
  const formData = new FormData();
  formData.append("avatar", file);

  return clientFetch<ProfileUser>("/users/me/avatar", {
    method: "POST",
    body: formData,
    // No Content-Type header — browser sets multipart/form-data + boundary
  });
}

/**
 * Remove the current user's avatar.
 */
export async function deleteAvatarClientApi(): Promise<ProfileUser> {
  return clientFetch<ProfileUser>("/users/me/avatar", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
}
