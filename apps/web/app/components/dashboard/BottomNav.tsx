"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "../../lib/utils";
import { MORE_ITEMS, PRIMARY_TABS, isActivePath } from "./nav-items";
import { MoreSheet } from "./MoreSheet";
import { LinkPendingDot } from "../ui/link-pending";

const tabClass =
  "group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-1 pt-2 text-[11px] font-medium leading-none transition-colors";

function TabIcon({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex h-8 w-14 items-center justify-center rounded-full transition-all duration-200 group-active:scale-90",
        active ? "bg-primary/15" : "bg-transparent",
      )}
    >
      {children}
    </span>
  );
}

/** Mobile tab bar: four primary tabs + "More" (hidden from `lg`, where the sidebar takes over). */
export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive =
    moreOpen || MORE_ITEMS.some((item) => isActivePath(pathname, item.href));

  return (
    <>
      <nav
        aria-label={t("menu")}
        className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface-sunken/90 backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch px-1">
          {PRIMARY_TABS.map((item) => {
            const Icon = item.icon;
            const active = !moreOpen && isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  tabClass,
                  "relative",
                  active ? "text-primary" : "text-foreground-muted",
                )}
              >
                <LinkPendingDot className="absolute top-1.5 left-1/2 ml-5" />
                <TabIcon active={active}>
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.4 : 2}
                    aria-hidden="true"
                  />
                </TabIcon>
                <span className="max-w-full truncate px-0.5">
                  {t(item.label)}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={cn(
              tabClass,
              moreActive ? "text-primary" : "text-foreground-muted",
            )}
          >
            <TabIcon active={moreActive}>
              <LayoutGrid
                size={22}
                strokeWidth={moreActive ? 2.4 : 2}
                aria-hidden="true"
              />
            </TabIcon>
            <span className="max-w-full truncate px-0.5">{t("more")}</span>
          </button>
        </div>
      </nav>

      {moreOpen && <MoreSheet onClose={() => setMoreOpen(false)} />}
    </>
  );
}
