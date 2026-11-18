"use client";

import { clearOfflineData } from "../lib/offline-cache";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startNavigationProgress } from "../lib/navigation-progress";
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
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: SigninPayload) => unwrap(serverSignin(payload)),
    // The form shows the failure inline next to the fields.
    meta: { errorToast: false },
    onSuccess: (data) => {
      // Start clean: never show data saved for a previous account.
      clearOfflineData();
      setSession(data.user);
      startNavigationProgress();
      // The dashboard has its own root layout (app/(app)), so this is a full
      // page load anyway; doing it directly can't be lost to a router race.
      window.location.assign("/dashboard");
    },
  });
}

export function useSignup() {
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: SignupPayload) => unwrap(serverSignup(payload)),
    // The form shows the failure inline next to the fields.
    meta: { errorToast: false },
    onSuccess: (data) => {
      // Start clean: never show data saved for a previous account.
      clearOfflineData();
      setSession(data.user);
      startNavigationProgress();
      // The dashboard has its own root layout (app/(app)), so this is a full
      // page load anyway; doing it directly can't be lost to a router race.
      window.location.assign("/dashboard");
    },
  });
}

export function useLogout() {
  const clearSession = useSessionStore((s) => s.clearSession);
  const queryClient = useQueryClient();

  // Sign-in lives under another root layout (app/(public)), so leaving is a
  // full page load. A client-side router.push here raced with the refresh
  // the server action triggers (it clears cookies) and with ProtectedPage's
  // own redirect, and about half the time the user stayed on the dashboard.
  // `replace` also keeps Back from returning to the dashboard.
  const leave = () => {
    clearOfflineData();
    queryClient.clear();
    startNavigationProgress();
    window.location.replace("/signin");
    clearSession();
  };

  return useMutation({
    mutationFn: async () => {
      await serverLogout();
    },
    // Logout always ends the local session, even if the API call failed.
    // No refetch afterwards: there is no session left to refetch with.
    meta: { errorToast: false, invalidate: false },
    onSuccess: leave,
    onError: leave,
  });
}
