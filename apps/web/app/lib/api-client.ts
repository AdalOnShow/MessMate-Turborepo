import { cookies } from "next/headers";
import { refreshAccessToken } from "../actions/auth";
import type { ActionResult } from "./action-result";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const UNREACHABLE: ActionResult<never> = {
  ok: false,
  status: 0,
  message: "Could not reach the server. Please try again in a moment.",
};

/**
 * Calls the API and reports failures as a value instead of throwing, so the
 * real message survives the server-action boundary (see action-result.ts).
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ActionResult<T>> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  const headers: Record<string, string> = {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type to application/json if body is not FormData and headers don't have it
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    console.error(`API request failed: ${path}`, err);
    return UNREACHABLE;
  }

  // Auto-refresh token on 401 if it's not a login/signup/refresh endpoint
  if (
    res.status === 401 &&
    path !== "/auth/refresh" &&
    path !== "/auth/signin" &&
    path !== "/auth/signup"
  ) {
    try {
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        // Retry request with new token
        const retryHeaders = {
          ...headers,
          Authorization: `Bearer ${newAccessToken}`,
        };
        res = await fetch(`${API_BASE}${path}`, {
          ...options,
          headers: retryHeaders,
        });
      }
    } catch (refreshErr) {
      console.error("Token refresh failed in api-client:", refreshErr);
    }
  }

  let json: (ApiResponse<T> & { details?: unknown }) | null = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON body (gateway error page, empty response, ...)
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      message:
        (typeof json?.message === "string" && json.message) ||
        `Request failed (${res.status})`,
      details: json?.details,
    };
  }

  if (!json) {
    return {
      ok: false,
      status: res.status,
      message: "The server returned an unreadable response.",
    };
  }

  return { ok: true, data: json.data as T };
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  postFormData: <T>(path: string, formData: FormData) =>
    request<T>(path, {
      method: "POST",
      body: formData,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
