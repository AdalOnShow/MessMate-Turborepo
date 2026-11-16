"use client";

import { useEffect, useRef, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { initThemeFromStorage } from "./store/theme";
import { getQueryClient } from "./lib/query-client";
import { initPwa } from "./lib/pwa";
import { Toaster } from "./components/feedback/Toaster";
import { OfflineBanner } from "./components/feedback/OfflineBanner";
import { CursorFollower } from "./components/ui/cursor-follower";

export function Providers({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initThemeFromStorage();
    initPwa();
  }, []);

  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      {children}
      <Toaster />
      <CursorFollower />
    </QueryClientProvider>
  );
}
