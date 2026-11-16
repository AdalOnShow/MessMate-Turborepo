"use client";

import { useEffect, useRef, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { initThemeFromStorage } from "./store/theme";
import { getQueryClient } from "./lib/query-client";
import { Toaster } from "./components/feedback/Toaster";
import { OfflineBanner } from "./components/feedback/OfflineBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initThemeFromStorage();
  }, []);

  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
