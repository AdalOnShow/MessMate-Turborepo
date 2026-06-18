"use client";

import { useEffect } from "react";
import { useSessionStore } from "../store";
import { getCurrentUser } from "../actions/auth";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const setSession = useSessionStore((s) => s.setSession);
  const clearSession = useSessionStore((s) => s.clearSession);

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
        }
      })
      .catch(() => {
        if (mounted) {
          clearSession();
        }
      });

    return () => {
      mounted = false;
    };
  }, [setSession, clearSession]);

  return <>{children}</>;
}
