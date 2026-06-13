import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import type { SessionStore } from "./types";

export const useSessionStore = create<SessionStore>()(
  devtools(
    immer((set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,

      setSession: (token, user) =>
        set((state) => {
          state.accessToken = token;
          state.user = user;
          state.isAuthenticated = true;
        }),

      clearSession: () =>
        set((state) => {
          state.accessToken = null;
          state.user = null;
          state.isAuthenticated = false;
        }),
    })),
    { enabled: true, name: "SessionStore" },
  ),
);