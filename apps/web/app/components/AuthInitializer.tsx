"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSessionStore } from "../store";
import { getCurrentUser } from "../actions/auth";
import { AppSplash } from "./feedback/AppSplash";
import {
  clearOfflineData,
  loadCachedUser,
  persistQueries,
  restoreQueries,
  saveCachedUser,
} from "../lib/offline-cache";

/**
 * Establishes the session. When this device has a saved user, the app
 * renders immediately with the saved data and confirms the session with the
 * server in the background; otherwise it waits for that check.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const setSession = useSessionStore((s) => s.setSession);
  const clearSession = useSessionStore((s) => s.clearSession);
  const userId = useSessionStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const cached = loadCachedUser();
    if (cached) {
      restoreQueries(queryClient, cached.id);
      setSession(cached);
      setInitialized(true);
    }

    getCurrentUser()
      .then((user) => {
        if (!mounted) return;
        if (user) {
          if (cached && cached.id !== user.id) {
            // A different account signed in on this device.
            queryClient.clear();
            clearOfflineData();
          }
          saveCachedUser(user);
          setSession(user);
        } else {
          clearOfflineData();
          queryClient.clear();
          clearSession();
        }
        setInitialized(true);
      })
      .catch(() => {
        // Network failure: keep the saved session if there is one.
        if (!mounted) return;
        if (!cached) clearSession();
        setInitialized(true);
      });

    return () => {
      mounted = false;
    };
  }, [setSession, clearSession, queryClient]);

  useEffect(() => {
    if (!userId) return;
    return persistQueries(queryClient, userId);
  }, [queryClient, userId]);

  if (!initialized) {
    return <AppSplash />;
  }

  return <>{children}</>;
}
