export type ThemeMode = "light" | "dark" | "system";

export interface ThemeState {
  mode: ThemeMode;
}

export interface ThemeActions {
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export type ThemeStore = ThemeState & ThemeActions;

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";

const STORAGE_KEY = "messmate-theme";

const LIGHT_VARS = {
  "--color-background": "#F8FAFC",
  "--color-surface": "#E2E8F0",
  "--color-surface-raised": "#FFFFFF",
  "--color-foreground": "#0F172A",
  "--color-foreground-muted": "#475569",
} as const;

const DARK_VARS = {
  "--color-background": "#0B1120",
  "--color-surface": "#111827",
  "--color-surface-raised": "#1E293B",
  "--color-foreground": "#F1F5F9",
  "--color-foreground-muted": "#94A3B8",
} as const;

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(mode: ThemeMode) {
  const resolved = mode === "system" ? getSystemTheme() : mode;
  const vars = resolved === "light" ? LIGHT_VARS : DARK_VARS;

  const root = document.documentElement;
  Object.entries(vars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });

  root.setAttribute("data-theme", resolved);
  root.style.colorScheme = resolved;
}

export function initThemeFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  const mode = saved || "dark";

  applyTheme(mode);

  useThemeStore.getState().setTheme(mode);
}

export const useThemeStore = create<ThemeStore>()(
  devtools(
    immer((set) => ({
      mode: "dark",

      setTheme: (mode: ThemeMode) =>
        set((state) => {
          state.mode = mode;
          localStorage.setItem(STORAGE_KEY, mode);
          applyTheme(mode);
        }),

      toggleTheme: () =>
        set((state) => {
          const current =
            state.mode === "system" ? getSystemTheme() : state.mode;
          const next: ThemeMode = current === "dark" ? "light" : "dark";
          state.mode = next;
          localStorage.setItem(STORAGE_KEY, next);
          applyTheme(next);
        }),
    })),
    { enabled: true, name: "ThemeStore" },
  ),
);
