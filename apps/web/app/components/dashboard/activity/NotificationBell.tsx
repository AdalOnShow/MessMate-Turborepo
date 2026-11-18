"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useUnreadNotifications } from "../../../hooks/use-notifications";
import { cn } from "../../../lib/utils";

/** Red count of unread notifications; nothing when all are read. */
export function UnreadBadge({ className }: { className?: string }) {
  const { unread } = useUnreadNotifications();
  if (unread === 0) return null;
  return (
    <span
      className={cn(
        "flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white tabular-nums",
        className,
      )}
    >
      {unread > 9 ? "9+" : unread}
    </span>
  );
}

/** Bell in the mobile top bar, opening the Notifications page. */
export function NotificationBell() {
  const t = useTranslations("nav");
  const { unread } = useUnreadNotifications();
  return (
    <Link
      href="/dashboard/activity"
      aria-label={
        unread > 0 ? `${t("notifications")} (${unread})` : t("notifications")
      }
      className="relative flex size-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors active:bg-surface-raised"
    >
      <Bell size={22} aria-hidden="true" />
      <UnreadBadge className="absolute right-0.5 top-0.5 border-2 border-background" />
    </Link>
  );
}
