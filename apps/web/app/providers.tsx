"use client";

import { useEffect, useRef } from "react";
import { initThemeFromStorage } from "./store/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initThemeFromStorage();
  }, []);

  return <>{children}</>;
}
