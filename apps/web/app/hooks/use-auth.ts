"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSessionStore } from "../store";

// Server Action imports
import {
  signup as serverSignup,
  signin as serverSignin,
  logout as serverLogout,
} from "../actions/auth";

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
    mutationFn: async (payload: SigninPayload) => {
      const result = await serverSignin(payload);
      return result;
    },
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
    onError: (error) => {
      console.error("Signin error:", error);
    },
  });
}

export function useSignup() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (payload: SignupPayload) => {
      const result = await serverSignup(payload);
      return result;
    },
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
    onError: (error) => {
      console.error("Signup error:", error);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: async () => {
      await serverLogout();
    },
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
