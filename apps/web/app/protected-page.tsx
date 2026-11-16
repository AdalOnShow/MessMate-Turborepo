"use client";

import { useSessionStore } from "./store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppSplash } from "./components/feedback/AppSplash";
import { startNavigationProgress } from "./lib/navigation-progress";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSessionStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      startNavigationProgress();
      router.push("/signin");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return <AppSplash />; // Redirecting via useEffect
  }

  return <>{children}</>;
}
