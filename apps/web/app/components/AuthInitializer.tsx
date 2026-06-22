"use client";

import { useEffect, useState } from "react";
import { useSessionStore } from "../store";
import { getCurrentUser } from "../actions/auth";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const setSession = useSessionStore((s) => s.setSession);
  const clearSession = useSessionStore((s) => s.clearSession);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    getCurrentUser()
      .then((user) => {
        if (mounted) {
          if (user) {
            setSession(user);
          } else {
            clearSession();
          }
          setInitialized(true);
        }
      })
      .catch(() => {
        if (mounted) {
          clearSession();
          setInitialized(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [setSession, clearSession]);

  if (!initialized) {
    return null;
  }

  return <>{children}</>;
}
