"use client";

import { useSessionStore } from "../store";
import { useEffect } from "react";
import { AppSplash } from "../components/feedback/AppSplash";
import { startNavigationProgress } from "../lib/navigation-progress";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSessionStore();

  useEffect(() => {
    if (!isAuthenticated) {
      startNavigationProgress();
      // /signin has another root layout: a full page load, done directly.
      window.location.replace("/signin");
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <AppSplash />; // Redirecting via useEffect
  }

  return <>{children}</>;
}
