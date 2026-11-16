"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSessionStore } from "../../store";
import { UserAvatar } from "./UserAvatar";
import { getPageMeta } from "./nav-items";

/** Sticky app bar for small screens (the sidebar is hidden below `lg`).
 *  Home shows the brand; other pages show their title, sub-pages a back button. */
export function MobileTopBar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const user = useSessionStore((s) => s.user);
  const { label, backHref } = getPageMeta(pathname);

  return (
    <header className="pt-safe sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center gap-2 px-4">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={t("back")}
            className="-ml-2 flex size-10 items-center justify-center rounded-full text-foreground transition-colors active:bg-surface-raised"
          >
            <ChevronLeft size={24} aria-hidden="true" />
          </Link>
        ) : null}

        {label ? (
          <h1 className="min-w-0 flex-1 truncate text-lg font-bold tracking-[-0.02em] text-foreground">
            {t(label)}
          </h1>
        ) : (
          <Link href="/dashboard" className="flex flex-1 items-center gap-2">
            <span className="flex size-8 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-raised">
              <Image
                src="/messmate-icon.png"
                alt=""
                width={460}
                height={400}
                className="h-5 w-auto object-contain"
              />
            </span>
            <span className="text-base font-extrabold tracking-[-0.03em] text-foreground">
              Mess<span className="text-primary">Mate</span>
            </span>
          </Link>
        )}

        <Link
          href="/dashboard/profile"
          aria-label={t("profile")}
          className="shrink-0 rounded-full active:opacity-80"
        >
          <UserAvatar
            name={user?.name}
            email={user?.email}
            avatar={user?.avatar}
            className="size-9 text-xs"
          />
        </Link>
      </div>
    </header>
  );
}
