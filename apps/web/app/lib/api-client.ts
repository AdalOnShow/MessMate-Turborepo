import { cookies } from "next/headers";
import { ErrorCode } from "@repo/shared";
import { refreshAccessToken } from "../actions/auth";
import type { ActionFailure, ActionResult } from "./action-result";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const REQUEST_TIMEOUT_MS = 15_000;

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  code?: ErrorCode;
  requestId?: string;
  details?: unknown;
}

/**
 * `fetch` with a request id and a timeout. Never throws: transport failures
 * come back as an `ActionFailure` so callers can return it as-is.
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
  requestId: string = crypto.randomUUID(),
): Promise<Response | ActionFailure> {
  const headers = new Headers(init.headers);
  headers.set("X-Request-Id", requestId);

  try {
    return await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut =
      err instanceof DOMException &&
      (err.name === "TimeoutError" || err.name === "AbortError");
    console.error(
      JSON.stringify({
        level: "error",
        requestId,
        path,
        error: timedOut ? "timeout" : String(err),
      }),
    );
    return {
      ok: false,
      status: 0,
      code: timedOut ? ErrorCode.TIMEOUT : ErrorCode.NETWORK_ERROR,
      requestId,
      message: timedOut
        ? "The server took too long to respond."
        : "Could not reach the server.",
    };
  }
}

/** Build an `ActionFailure` from a non-2xx API response. */
export async function readFailure(res: Response): Promise<ActionFailure> {
  let json: Partial<ApiResponse<unknown>> | null = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON body (gateway error page, empty response, ...)
  }
  return {
    ok: false,
    status: res.status,
    message:
      (typeof json?.message === "string" && json.message) ||
      `Request failed (${res.status})`,
    code: json?.code,
    requestId: json?.requestId ?? res.headers.get("X-Request-Id") ?? undefined,
    details: json?.details,
  };
}

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
  const requestId = crypto.randomUUID();

  const headers: Record<string, string> = {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type to application/json if body is not FormData and headers don't have it
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res = await apiFetch(path, { ...options, headers }, requestId);
  if (!(res instanceof Response)) return res;

  // Auto-refresh token on 401 if it's not a login/signup/refresh endpoint
  if (
    res.status === 401 &&
    path !== "/auth/refresh" &&
    path !== "/auth/signin" &&
    path !== "/auth/signup"
  ) {
    let newAccessToken: string | null = null;
    try {
      newAccessToken = await refreshAccessToken();
    } catch (refreshErr) {
      console.error("Token refresh failed in api-client:", refreshErr);
    }
    if (newAccessToken) {
      const retried = await apiFetch(
        path,
        {
          ...options,
          headers: { ...headers, Authorization: `Bearer ${newAccessToken}` },
        },
        requestId,
      );
      if (!(retried instanceof Response)) return retried;
      res = retried;
    } else if (res.status === 401) {
      const failure = await readFailure(res);
      return {
        ...failure,
        code: ErrorCode.SESSION_EXPIRED,
        message: "Your session has expired. Please sign in again.",
      };
    }
  }

  if (!res.ok) return readFailure(res);

  let json: ApiResponse<T> | null = null;
  try {
    json = await res.json();
  } catch {
    // fall through
  }

  if (!json) {
    return {
      ok: false,
      status: 502,
      code: ErrorCode.SERVICE_UNAVAILABLE,
      requestId,
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
