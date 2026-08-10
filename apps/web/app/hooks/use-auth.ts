"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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

export function useSignin() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (payload: SigninPayload) => {
      const result = await serverSignin(payload);
      return result;
    },
    onSuccess: (data) => {
      setSession(data.user);
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
    onSuccess: (data) => {
      setSession(data.user);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await serverLogout();
    },
    onSuccess: () => {
      queryClient.clear();
      clearSession();
      router.push("/");
    },
    onError: () => {
      queryClient.clear();
      clearSession();
      router.push("/");
    },
  });
}
