"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useSessionStore } from "../../store";
import { useLogout } from "../../hooks/use-auth";
import { useGetMyMess } from "../../hooks/use-messes";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "../LanguageToggle";
import { UserAvatar } from "./UserAvatar";
import { LinkPendingDot } from "../ui/link-pending";
import { MANAGER_NAV_ITEMS, SIDEBAR_ITEMS, isActivePath } from "./nav-items";

export function Sidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const user = useSessionStore((state) => state.user);
  const tc = useTranslations("common");
  const logout = useLogout();
  const { data: myMess } = useGetMyMess();
  const isManager = myMess?.current_user_role === "MANAGER";

  return (
    <aside className="hidden border-border bg-surface-sunken lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-72 lg:flex-col lg:border-r">
      <div className="flex h-[60px] items-center gap-3 border-b border-border px-5">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-raised">
          <Image
            src="/messmate-icon.png"
            alt="MessMate"
            width={460}
            height={400}
            className="h-6 w-auto object-contain"
          />
        </div>
        <Link
          href="/dashboard"
          className="text-lg font-extrabold tracking-[-0.03em] text-foreground"
        >
          Mess<span className="text-primary">Mate</span>
        </Link>
        <LanguageToggle className="ml-auto" />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5">
        <p className="label-mono mb-2 px-3 text-[10px] text-foreground-muted">
          {t("workspace")}
        </p>
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex h-10 items-center gap-3 rounded-lg border px-3 text-sm font-medium transition-colors ${
                active
                  ? "border-primary/25 bg-primary/10 text-foreground before:absolute before:inset-y-2 before:-left-3 before:w-0.5 before:rounded-full before:bg-primary [&_svg]:text-primary"
                  : "border-transparent text-foreground-muted hover:bg-surface-raised hover:text-foreground"
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {t(item.label)}
              <LinkPendingDot className="ml-auto" />
            </Link>
          );
        })}

        {isManager && (
          <>
            <p className="label-mono mb-2 mt-5 px-3 text-[10px] text-foreground-muted">
              {t("manager")}
            </p>
            {MANAGER_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-10 items-center gap-3 rounded-lg border px-3 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary/25 bg-primary/10 text-foreground before:absolute before:inset-y-2 before:-left-3 before:w-0.5 before:rounded-full before:bg-primary [&_svg]:text-primary"
                      : "border-transparent text-foreground-muted hover:bg-surface-raised hover:text-foreground"
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                  {t(item.label)}
                  <LinkPendingDot className="ml-auto" />
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
          <UserAvatar
            name={user?.name}
            email={user?.email}
            avatar={user?.avatar}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {user?.name || t("userFallback")}
            </p>
            <p className="truncate font-mono text-[11px] text-foreground-muted">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-[9px] border border-border text-sm font-semibold text-foreground-muted transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut size={16} aria-hidden="true" />
          {tc("logout")}
        </button>
      </div>
    </aside>
  );
}
