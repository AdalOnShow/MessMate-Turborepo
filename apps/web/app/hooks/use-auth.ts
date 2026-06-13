"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "../lib/api-client";
import { useSessionStore } from "../store";

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

interface AuthResponse {
  accessToken: string;
}

function decodeJwt(token: string): { sub: string; email: string } | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function useSignin() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: SigninPayload) =>
      api.post<AuthResponse>("/auth/signin", payload),
    onSuccess: (data) => {
      const decoded = decodeJwt(data.accessToken);
      if (decoded) {
        setSession(data.accessToken, {
          id: decoded.sub,
          email: decoded.email,
          name: "",
        });
      }
      router.push("/dashboard");
    },
  });
}

export function useSignup() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: SignupPayload) =>
      api.post<AuthResponse>("/auth/signup", payload),
    onSuccess: (data, variables) => {
      const decoded = decodeJwt(data.accessToken);
      if (decoded) {
        setSession(data.accessToken, {
          id: decoded.sub,
          email: decoded.email,
          name: variables.name,
        });
      }
      router.push("/dashboard");
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: () => api.post<void>("/auth/logout"),
    onSuccess: () => {
      clearSession();
      router.push("/");
    },
    onError: () => {
      clearSession();
      router.push("/");
    },
  });
}
