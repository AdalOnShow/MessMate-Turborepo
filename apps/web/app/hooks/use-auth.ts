"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSessionStore } from "../store";
import { unwrap } from "../lib/action-result";

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
    mutationFn: (payload: SigninPayload) => unwrap(serverSignin(payload)),
    // The form shows the failure inline next to the fields.
    meta: { errorToast: false },
    onSuccess: (data) => {
      setSession(data.user);
      router.push("/dashboard");
    },
  });
}

export function useSignup() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: SignupPayload) => unwrap(serverSignup(payload)),
    // The form shows the failure inline next to the fields.
    meta: { errorToast: false },
    onSuccess: (data) => {
      setSession(data.user);
      router.push("/dashboard");
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
    // Logout always ends the local session, even if the API call failed.
    meta: { errorToast: false },
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
