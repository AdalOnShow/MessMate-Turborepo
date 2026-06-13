"use client";

import { useSessionStore } from "../store";

export function UserSessionDisplay() {
  const user = useSessionStore((state) => state.user);
  const createUser = useSessionStore((state) => state.createSession);

  const handleCreateUser = () => {
    createUser({
      username: "JohnDoe",
      email: "john@example.com",
      twitchUsername: "johndoe",
    });
  };

  const clear = useSessionStore((state) => state.clearSession);

  const handleLogout = () => {
    clear();
  };

  return (
    <div className="mt-8 p-6 bg-surface-raised rounded-xl border border-[rgba(148,163,184,0.1)]">
      <h2 className="text-2xl font-bold text-foreground mb-4">
        Zustand Store Demo
      </h2>

      {user ? (
        <div className="space-y-3">
          <p className="text-lg text-foreground">
            Welcome, {user.username}! 👋
          </p>
          <div className="text-sm text-foreground-muted bg-background/50 p-3 rounded-lg">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Twitch Username:</strong>{" "}
              {user.twitchUsername || "Not set"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-lg text-foreground-muted">No user session found</p>
          <button
            onClick={handleCreateUser}
            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer"
          >
            Login with demo user
          </button>
        </div>
      )}

      <div className="mt-4 p-3 bg-background/30 rounded-lg">
        <p className="text-xs text-foreground-muted mb-2">
          Current Zustand store devtools are enabled. Check your browser
          DevTools → Extensions → Zustand
        </p>
        <code className="text-xs text-foreground/70">
          State: {JSON.stringify(user, null, 2)}
        </code>
      </div>
    </div>
  );
}
