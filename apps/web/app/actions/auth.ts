"use server";

import { cookies, headers as requestHeaders } from "next/headers";
import { jwtDecode } from "jwt-decode";
import type { ActionResult } from "../lib/action-result";
import { ErrorCode } from "@repo/shared";
import { api, apiFetch, readFailure } from "../lib/api-client";
import {
  clearAuthCookies,
  extractRefreshCookie,
  setAuthCookies,
} from "../lib/auth-cookies";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Server-side API call to NestJS
async function callNestJSAPI<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

interface SigninPayload {
  email: string;
  password: string;
}

interface SignupPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface JwtPayload {
  sub: string;
  email: string;
}

export interface ProfileUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  manager_created: boolean;
  email_verified: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
}

async function callAuthenticatedNestJSAPI<T>(
  endpoint: string,
  accessToken: string,
  options?: RequestInit,
): Promise<T> {
  return callNestJSAPI<T>(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options?.headers,
    },
  });
}

type AuthSuccess = { success: true; accessToken: string; user: ProfileUser };

/** POST to an auth endpoint; returns the token and response headers. */
async function postAuth(
  endpoint: string,
  payload: unknown,
): Promise<ActionResult<{ accessToken: string; headers: Headers }>> {
  // The API sees our server, not the browser; pass the browser's user agent
  // along so each signed-in device can be told apart.
  const userAgent = (await requestHeaders()).get("user-agent") ?? "";
  const res = await apiFetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-User-Agent": userAgent,
    },
    body: JSON.stringify(payload),
  });
  if (!(res instanceof Response)) return res;
  if (!res.ok) return readFailure(res);

  try {
    const json = (await res.json()) as { data?: { accessToken?: string } };
    const accessToken = json.data?.accessToken;
    if (!accessToken) throw new Error("missing accessToken");
    return { ok: true, data: { accessToken, headers: res.headers } };
  } catch {
    return {
      ok: false,
      status: 502,
      message: "The server returned an unreadable response.",
    };
  }
}

const BAD_TOKEN: ActionResult<never> = {
  ok: false,
  status: 502,
  message: "Sign in failed. Please try again.",
};

export async function signup(
  payload: SignupPayload,
): Promise<ActionResult<AuthSuccess>> {
  const result = await postAuth("/auth/signup", payload);
  if (!result.ok) return result;
  const { accessToken, headers } = result.data;

  const decoded = decodeJwt(accessToken);
  if (!decoded) return BAD_TOKEN;

  await setAuthCookies(accessToken, extractRefreshCookie(headers));

  return {
    ok: true,
    data: {
      success: true,
      accessToken,
      user: {
        id: decoded.sub,
        email: decoded.email,
        name: payload.name,
        phone: payload.phone ?? null,
        avatar: null,
        manager_created: false,
        email_verified: false,
      },
    },
  };
}

export async function signin(
  payload: SigninPayload,
): Promise<ActionResult<AuthSuccess>> {
  const result = await postAuth("/auth/signin", payload);
  if (!result.ok) return result;
  const { accessToken, headers } = result.data;

  const decoded = decodeJwt(accessToken);
  if (!decoded) return BAD_TOKEN;

  await setAuthCookies(accessToken, extractRefreshCookie(headers));

  const user = await getProfileWithToken(accessToken, {
    id: decoded.sub,
    email: decoded.email,
    name: "",
    phone: null,
    avatar: null,
    manager_created: false,
    email_verified: false,
  });

  return { ok: true, data: { success: true, accessToken, user } };
}

export async function logout(): Promise<{ success: true }> {
  const refreshToken = (await cookies()).get("refresh_token")?.value;

  // Ends this device's session on the server. Uses the refresh token, so it
  // works even when the access token has already expired.
  if (refreshToken) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
          Cookie: `refresh_token=${encodeURIComponent(refreshToken)}`,
        },
        signal: AbortSignal.timeout(5000),
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  await clearAuthCookies();
  return { success: true };
}

/**
 * The signed-in user, or null when there is no valid session.
 *
 * Goes through `api.get`, which renews an expired access token with the
 * refresh token. Access tokens last an hour, so reading only the access
 * cookie would sign people out every hour.
 */
export async function getCurrentUser(): Promise<ProfileUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;
  if (!accessToken && !refreshToken) return null;

  const result = await api.get<ProfileUser>("/users/me");
  if (result.ok) return result.data;

  // The session is gone (refresh rejected): signed out.
  if (result.code === ErrorCode.SESSION_EXPIRED || result.status === 401) {
    return null;
  }

  // Network or server trouble: keep the user signed in with what the
  // token says rather than bouncing them to the sign-in page.
  const decoded = accessToken ? decodeJwt(accessToken) : null;
  if (!decoded) throw new Error(result.message);
  return {
    id: decoded.sub,
    email: decoded.email,
    name: "",
    phone: null,
    avatar: null,
    manager_created: false,
    email_verified: false,
  };
}

async function getProfileWithToken(
  accessToken: string,
  fallback: ProfileUser,
): Promise<ProfileUser> {
  try {
    const response = await callAuthenticatedNestJSAPI<ApiResponse<ProfileUser>>(
      "/users/me",
      accessToken,
    );

    return response.data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;
    if (!refreshToken) {
      return null;
    }

    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refresh_token=${encodeURIComponent(refreshToken)}`,
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      // Only a rejected token ends the session. A rate limit (429) or a
      // server hiccup (5xx) must not sign the user out.
      if (response.status === 401 || response.status === 403) {
        await clearAuthCookies();
      }
      return null;
    }

    const json = (await response.json()) as {
      success: boolean;
      data: { accessToken: string };
    };
    const newAccessToken = json.data.accessToken;

    // The API re-sends the refresh cookie so its 30-day lifetime slides.
    await setAuthCookies(
      newAccessToken,
      extractRefreshCookie(response.headers) ?? refreshToken,
    );

    return newAccessToken;
  } catch (error) {
    console.error("Refresh token error in server action:", error);
    return null;
  }
}
