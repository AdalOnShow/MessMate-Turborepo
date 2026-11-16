"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronRight,
  Download,
  LogOut,
  Share,
  SquarePlus,
} from "lucide-react";
import { Sheet } from "../ui/sheet";
import { ThemeToggle } from "../ThemeToggle";
import { LanguageToggle } from "../LanguageToggle";
import { UserAvatar } from "./UserAvatar";
import { MORE_ITEMS, isActivePath } from "./nav-items";
import { useSessionStore } from "../../store";
import { useLogout } from "../../hooks/use-auth";
import { useGetMyMess } from "../../hooks/use-messes";
import { promptInstall, useInstallState } from "../../lib/pwa";
import { cn } from "../../lib/utils";
import { LinkPendingDot } from "../ui/link-pending";

/** "More" tab content: secondary pages, preferences, install and logout. */
export function MoreSheet({ onClose }: { onClose: () => void }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const user = useSessionStore((s) => s.user);
  const logout = useLogout();
  const { data: myMess } = useGetMyMess();
  const isManager = myMess?.current_user_role === "MANAGER";
  const install = useInstallState();
  const [showIosHint, setShowIosHint] = useState(false);

  const items = MORE_ITEMS.filter(
    (item) => !item.managerOnly || isManager,
  ).filter((item) => item.href !== "/dashboard/profile");

  return (
    <Sheet onClose={onClose} className="space-y-5">
      {/* Account */}
      <Link
        href="/dashboard/profile"
        onClick={onClose}
        className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition-colors active:bg-surface-raised"
      >
        <UserAvatar
          name={user?.name}
          email={user?.email}
          avatar={user?.avatar}
          className="size-12"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">
            {user?.name || t("userFallback")}
          </p>
          <p className="truncate text-xs text-foreground-muted">
            {myMess?.name ?? user?.email}
          </p>
        </div>
        <ChevronRight
          size={18}
          className="text-foreground-muted"
          aria-hidden="true"
        />
      </Link>

      {/* Pages */}
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border p-2 text-center text-xs font-medium transition-transform active:scale-95",
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-surface text-foreground",
              )}
            >
              <LinkPendingDot className="absolute top-2 right-2" />
              <Icon size={22} aria-hidden="true" />
              <span className="line-clamp-2 leading-tight">
                {t(item.label)}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Install */}
      {install.kind === "prompt" && (
        <button
          type="button"
          onClick={async () => {
            if (await promptInstall()) onClose();
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-left"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
            <Download size={20} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">
              {t("installApp")}
            </span>
            <span className="block text-xs text-foreground-muted">
              {t("installDesc")}
            </span>
          </span>
        </button>
      )}
      {install.kind === "ios" && (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3">
          <button
            type="button"
            onClick={() => setShowIosHint((v) => !v)}
            aria-expanded={showIosHint}
            className="flex w-full items-center gap-3 text-left"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
              <SquarePlus size={20} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                {t("installIosTitle")}
              </span>
              <span className="block text-xs text-foreground-muted">
                {t("installDesc")}
              </span>
            </span>
          </button>
          {showIosHint && (
            <p className="mt-3 flex items-start gap-2 text-sm text-foreground-body">
              <Share
                size={16}
                className="mt-0.5 shrink-0 text-primary"
                aria-hidden="true"
              />
              {t("installIosHint")}
            </p>
          )}
        </div>
      )}

      {/* Preferences */}
      <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="text-sm font-medium text-foreground">
            {t("theme")}
          </span>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="text-sm font-medium text-foreground">
            {t("language")}
          </span>
          <LanguageToggle />
        </div>
      </div>

      <button
        type="button"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 text-sm font-semibold text-destructive transition-colors active:bg-destructive/20 disabled:opacity-60"
      >
        <LogOut size={18} aria-hidden="true" />
        {tc("logout")}
      </button>
    </Sheet>
  );
}
