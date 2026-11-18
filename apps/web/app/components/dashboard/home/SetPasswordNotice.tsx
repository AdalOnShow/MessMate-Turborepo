"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { KeyRound } from "lucide-react";
import { useGetProfile } from "@/app/hooks/use-profile";

/**
 * For accounts a manager created: the manager chose the password, so ask
 * the user to set their own. Stays until they do (the API clears
 * `must_change_password` on a password change and the profile refetches).
 */
export function SetPasswordNotice() {
  const t = useTranslations("dashboard.setPasswordNotice");
  const { data: profile } = useGetProfile();
  if (!profile?.must_change_password) return null;

  return (
    <div
      role="alert"
      className="mb-5 flex flex-col gap-3 rounded-2xl border border-accent-warm/35 bg-accent-warm/10 p-4 sm:flex-row sm:items-center sm:gap-4"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-warm/20 text-accent-warm">
        <KeyRound size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{t("title")}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-foreground-muted">
          {t("body")}
        </p>
        <p className="mt-1 text-xs text-foreground-muted">{t("hint")}</p>
      </div>
      <Link
        href="/dashboard/profile#password"
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-accent-warm px-4 text-sm font-semibold text-cta-foreground transition-colors hover:opacity-90"
      >
        {t("action")}
      </Link>
    </div>
  );
}
