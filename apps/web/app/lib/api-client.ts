import { cookies } from "next/headers";
import { refreshAccessToken } from "../actions/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: { message?: string; details?: unknown },
  ) {
    super(body?.message || "API Error");
    this.name = "ApiError";
  }
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("access_token")?.value;

  const headers: Record<string, string> = {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type to application/json if body is not FormData and headers don't have it
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

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

  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(res.status, {
      message: `HTTP Error: ${res.status} ${res.statusText}`,
    });
  }

  if (!res.ok) {
    throw new ApiError(res.status, json);
  }

  return json.data as T;
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
