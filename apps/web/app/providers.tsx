"use client";

import { useEffect, useRef, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { initThemeFromStorage } from "./store/theme";
import { getQueryClient } from "./lib/query-client";
import { initPwa } from "./lib/pwa";
import { Toaster } from "./components/feedback/Toaster";
import { OfflineBanner } from "./components/feedback/OfflineBanner";
import { NavigationProgress } from "./components/feedback/NavigationProgress";

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
      <NavigationProgress />
      <OfflineBanner />
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
