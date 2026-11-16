"use client";

import { useTranslations } from "next-intl";
import { useSessionStore } from "../store";

export function UserSessionDisplay() {
  const t = useTranslations("misc.userSessionDisplay");
  const user = useSessionStore((state) => state.user);
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);

  const handleCreateUser = () => {
    setSession({
      id: "1",
      email: "john@example.com",
      name: "John Doe",
      phone: null,
      avatar: null,
      manager_created: false,
      email_verified: false,
    });
  };

  return (
    <div className="mt-8 p-6 bg-surface-raised rounded-xl border border-border">
      <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-foreground mb-4">
        {t("zustandStoreDemo")}
      </h2>

      {isAuthenticated && user ? (
        <div className="space-y-3">
          <p className="text-lg text-foreground">{t("welcome")}{" "}{user.name}!</p>
          <div className="text-sm text-foreground-muted bg-background/50 p-3 rounded-lg">
            <p>
              <strong>{t("id")}</strong> {user.id}
            </p>
            <p>
              <strong>{t("email")}</strong> {user.email}
            </p>
          </div>
          <button
            onClick={clearSession}
            className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer"
          >
            {t("logout")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-lg text-foreground-muted">{t("noUserSessionFound")}</p>
          <button
            onClick={handleCreateUser}
            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer"
          >
            {t("loginDemoUser")}
          </button>
        </div>
      )}

      <div className="mt-4 p-3 bg-background/30 rounded-lg">
        <p className="text-xs text-foreground-muted mb-2">
          {t("currentZustandStoreDevtools")}
        </p>
        <code className="text-xs text-foreground/70">
          {t("state")}{" "}{JSON.stringify(user, null, 2)}
        </code>
      </div>
    </div>
  );
}
