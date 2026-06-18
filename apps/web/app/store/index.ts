import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import type { SessionStore } from "./types";

export const useSessionStore = create<SessionStore>()(
  devtools(
    immer((set) => ({
      user: null,
      isAuthenticated: false,

      setSession: (user) =>
        set((state) => {
          state.user = user;
          state.isAuthenticated = true;
        }),

      clearSession: () =>
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
        }),
    })),
    { enabled: true, name: "SessionStore" },
  ),
);

if (process.env.NODE_ENV === "development") {
  useSessionStore.subscribe((state) => {
    console.log("[SessionStore] User state:", {
      isAuthenticated: state.isAuthenticated,
      user: state.user,
    });
  });
}
