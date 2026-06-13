import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import type { SessionStore, CreateSessionParams, SessionState } from "./types";

export const useSessionStore = create<SessionStore>()(
  devtools(
    immer((set) => ({
      user: null,
      isAuthenticated: false,

      createSession: (params: CreateSessionParams) =>
        set((state) => {
          state.user = {
            id: crypto.randomUUID(),
            username: params.username,
            email: params.email,
            twitchUsername: params.twitchUsername || null,
          };
          state.isAuthenticated = true;
        }),

      clearSession: () =>
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
        }),

      updateUser: (updates: Partial<SessionState["user"]>) =>
        set((state) => {
          if (state.user && updates) {
            for (const key of Object.keys(
              updates,
            ) as (keyof typeof updates)[]) {
              if (updates[key] !== undefined) {
                (state.user as Record<string, unknown>)[key] = updates[key];
              }
            }
          }
        }),
    })),
    { enabled: true, name: "SessionStore" },
  ),
);
