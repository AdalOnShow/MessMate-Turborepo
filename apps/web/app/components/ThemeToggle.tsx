"use client";

import { useThemeStore } from "../store/theme";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { mode, toggleTheme } = useThemeStore();
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function resolve() {
      if (mode === "system") {
        setResolved(mediaQuery.matches ? "dark" : "light");
      } else {
        setResolved(mode);
      }
    }

    resolve();
    mediaQuery.addEventListener("change", resolve);
    return () => mediaQuery.removeEventListener("change", resolve);
  }, [mode]);

  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center h-10 w-10 rounded-lg bg-surface hover:bg-surface transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 cursor-pointer"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span className="sr-only">{isDark ? "Light" : "Dark"} mode</span>
      <Sun
        className={`absolute h-5 w-5 transition-all duration-300 ${isDark
          ? "opacity-0 rotate-90 scale-0"
          : "opacity-100 rotate-0 scale-100"
          }`}
        size={20}
      />
      <Moon
        className={`absolute h-5 w-5 transition-all duration-300 ${isDark
          ? "opacity-100 rotate-0 scale-100"
          : "opacity-0 -rotate-90 scale-0"
          }`}
        size={20}
      />
    </button>
  );
}
