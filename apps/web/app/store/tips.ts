import { create } from "zustand";

const STORAGE_KEY = "messmate-tips";

/**
 * Whether the in-app Tips buttons are shown. A per-device preference, set
 * from Profile, like the theme. Defaults to on; storage can be unavailable
 * (private mode), in which case the default is used.
 */
function readEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

interface TipsStore {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useTipsStore = create<TipsStore>((set) => ({
  enabled: readEnabled(),
  setEnabled: (enabled) => {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
    } catch {
      // Not saved; it still applies until the page reloads.
    }
    set({ enabled });
  },
}));
