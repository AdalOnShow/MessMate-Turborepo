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

function decodeJwt(token: string): JwtPayload | null {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
}

export async function signup(payload: SignupPayload): Promise<{
  success: true;
  accessToken: string;
  user: { id: string; email: string; name: string };
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
  user: { id: string; email: string; name: string };
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

    return {
      success: true,
      accessToken,
      user: {
        id: decoded.sub,
        email: decoded.email,
        name: "",
      },
    };
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

  // Optionally call NestJS user profile API
  try {
    const user = await callNestJSAPI<{
      id: string;
      email: string;
      name: string;
    }>(`/users/${decoded.sub}`);
    return user;
  } catch {
    // Fallback to decoded info
    return {
      id: decoded.sub,
      email: decoded.email,
      name: "",
    };
  }
}

export async function handleGoogleCallback(accessToken: string): Promise<{
  success: true;
  user: { id: string; email: string; name: string };
}> {
  const decoded = decodeJwt(accessToken);
  if (!decoded) {
    throw new Error("Invalid access token");
  }

  const cookieStore = await cookies();
  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 604800,
    path: "/",
  });

  return {
    success: true,
    user: {
      id: decoded.sub,
      email: decoded.email,
      name: "",
    },
  };
}
