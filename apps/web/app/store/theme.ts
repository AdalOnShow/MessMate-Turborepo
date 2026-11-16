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

// Palette values live in globals.css (`@theme` + `[data-theme="light"]`).
// Clear any inline overrides left by older versions so the stylesheet wins.
const THEME_VARS = [
  "--color-background",
  "--color-surface",
  "--color-surface-raised",
  "--color-foreground",
  "--color-foreground-muted",
] as const;

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(mode: ThemeMode) {
  const resolved = mode === "system" ? getSystemTheme() : mode;
  const root = document.documentElement;
  THEME_VARS.forEach((key) => root.style.removeProperty(key));

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
