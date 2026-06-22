"use server";

import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

// Server-side API call to NestJS
async function callNestJSAPI<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const response = await fetch(`${baseUrl}${endpoint}`, {
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

export async function signup(payload: SignupPayload): Promise<{
  success: true;
  accessToken: string;
  user: ProfileUser;
}> {
  try {
    const response = await callNestJSAPI<{
      success: boolean;
      message: string;
      data: { accessToken: string };
    }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const accessToken = response.data.accessToken;
    const decoded = decodeJwt(accessToken);
    if (!decoded) {
      throw new Error("Failed to decode token");
    }

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 604800, // 7 days
      path: "/",
    });

    return {
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
    };
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
}

export async function signin(payload: SigninPayload): Promise<{
  success: true;
  accessToken: string;
  user: ProfileUser;
}> {
  try {
    const response = await callNestJSAPI<{
      success: boolean;
      message: string;
      data: { accessToken: string };
    }>("/auth/signin", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const accessToken = response.data.accessToken;
    const decoded = decodeJwt(accessToken);
    if (!decoded) {
      throw new Error("Failed to decode token");
    }

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 604800, // 7 days
      path: "/",
    });

    const user = await getProfileWithToken(accessToken, {
      id: decoded.sub,
      email: decoded.email,
      name: "",
      phone: null,
      avatar: null,
      manager_created: false,
      email_verified: false,
    });

    return { success: true, accessToken, user };
  } catch (error) {
    console.error("Signin error:", error);
    throw error;
  }
}

export async function logout(): Promise<{ success: true }> {
  try {
    // Call NestJS logout API
    await callNestJSAPI("/auth/logout", {
      method: "POST",
    });

    // Clear cookies
    const cookieStore = await cookies();
    cookieStore.set("access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    // Still clear cookies even if API call fails
    const cookieStore = await cookies();
    cookieStore.set("access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });
    return { success: true };
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get?.("access_token")?.value;

  if (!accessToken) {
    return null;
  }

  const decoded = decodeJwt(accessToken);
  if (!decoded) {
    return null;
  }

  try {
    return await getProfileWithToken(accessToken, {
      id: decoded.sub,
      email: decoded.email,
      name: "",
      phone: null,
      avatar: null,
      manager_created: false,
      email_verified: false,
    });
  } catch {
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
