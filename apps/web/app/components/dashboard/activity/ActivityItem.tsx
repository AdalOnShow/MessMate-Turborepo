"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  Activity,
  ChefHat,
  Crown,
  Landmark,
  Receipt,
  ShoppingCart,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import type { ActivityLogInfo } from "@/app/hooks/use-members";
import { formatDateOnly, formatMoney } from "@/app/lib/format";
import { UserAvatar } from "../UserAvatar";

type ActivityLabel =
  | "memberAdded"
  | "memberRemoved"
  | "managerAssigned"
  | "managerRemoved"
  | "mealsAdded"
  | "mealsUpdated"
  | "mealsDeleted"
  | "expenseAdded"
  | "expenseUpdated"
  | "expenseDeleted"
  | "depositAdded"
  | "depositUpdated"
  | "depositDeleted"
  | "monthOpened"
  | "monthClosed"
  | "balanceCreated"
  | "defaultMealsUpdated"
  | "bazaarSubmitted"
  | "bazaarUpdated"
  | "bazaarApproved"
  | "bazaarRejected"
  | "bazaarDeleted";

const ACTION_META: Record<
  ActivityLogInfo["action"],
  { label: ActivityLabel; icon: ReactNode }
> = {
  MEMBER_ADDED: { label: "memberAdded", icon: <UserPlus size={14} /> },
  MEMBER_REMOVED: { label: "memberRemoved", icon: <UserMinus size={14} /> },
  MANAGER_ASSIGNED: { label: "managerAssigned", icon: <Crown size={14} /> },
  MANAGER_REMOVED: { label: "managerRemoved", icon: <Crown size={14} /> },
  MEAL_ADDED: { label: "mealsAdded", icon: <ChefHat size={14} /> },
  MEAL_UPDATED: { label: "mealsUpdated", icon: <ChefHat size={14} /> },
  MEAL_DELETED: { label: "mealsDeleted", icon: <ChefHat size={14} /> },
  EXPENSE_ADDED: { label: "expenseAdded", icon: <Receipt size={14} /> },
  EXPENSE_UPDATED: { label: "expenseUpdated", icon: <Receipt size={14} /> },
  EXPENSE_DELETED: { label: "expenseDeleted", icon: <Receipt size={14} /> },
  DEPOSIT_ADDED: { label: "depositAdded", icon: <Landmark size={14} /> },
  DEPOSIT_UPDATED: { label: "depositUpdated", icon: <Landmark size={14} /> },
  DEPOSIT_DELETED: { label: "depositDeleted", icon: <Landmark size={14} /> },
  MONTH_OPENED: { label: "monthOpened", icon: <Activity size={14} /> },
  MONTH_CLOSED: { label: "monthClosed", icon: <Activity size={14} /> },
  MEMBER_BALANCE_CREATED: {
    label: "balanceCreated",
    icon: <Users size={14} />,
  },
  DEFAULT_MEALS_UPDATED: {
    label: "defaultMealsUpdated",
    icon: <ChefHat size={14} />,
  },
  BAZAAR_SUBMITTED: {
    label: "bazaarSubmitted",
    icon: <ShoppingCart size={14} />,
  },
  BAZAAR_UPDATED: { label: "bazaarUpdated", icon: <ShoppingCart size={14} /> },
  BAZAAR_APPROVED: {
    label: "bazaarApproved",
    icon: <ShoppingCart size={14} />,
  },
  BAZAAR_REJECTED: {
    label: "bazaarRejected",
    icon: <ShoppingCart size={14} />,
  },
  BAZAAR_DELETED: {
    label: "bazaarDeleted",
    icon: <ShoppingCart size={14} />,
  },
};

type T = ReturnType<typeof useTranslations<"dashboard.recentActivity">>;

function timeAgo(iso: string, t: T) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("justNow");
  if (mins < 60) return t("minutesAgo", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("daysAgo", { count: days });
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** "Gas Bill · ৳1,000 · Nov 17" from whatever details the entry has. */
function describe(details: ActivityLogInfo["details"], t: T): string | null {
  if (!details) return null;
  const parts: string[] = [];
  if (details.title) parts.push(details.title);
  if (details.member) parts.push(details.member);
  if (typeof details.meals === "number") {
    parts.push(t("mealsCount", { count: details.meals }));
  }
  if (typeof details.amount === "number") {
    parts.push(formatMoney(details.amount));
  }
  if (details.date) {
    parts.push(
      formatDateOnly(details.date, { month: "short", day: "numeric" }),
    );
  }
  return parts.length ? parts.join(" · ") : null;
}

/** One activity: what happened, what it was about, who did it and when. */
export function ActivityItem({ activity }: { activity: ActivityLogInfo }) {
  const t = useTranslations("dashboard.recentActivity");
  const meta = ACTION_META[activity.action];
  const detail = describe(activity.details, t);

  return (
    <li className="flex items-center gap-3 rounded-xl px-1 py-2">
      <span className="relative shrink-0">
        <UserAvatar
          name={activity.actor.name}
          avatar={activity.actor.avatar}
          className="size-9 text-xs"
        />
        <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-surface bg-surface-raised text-primary [&_svg]:size-2.5">
          {meta?.icon ?? <Activity />}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {meta ? t(meta.label) : activity.action}
        </p>
        {detail ? (
          <p className="truncate text-xs text-foreground" title={detail}>
            {detail}
          </p>
        ) : null}
        <p className="truncate text-xs text-foreground-muted">
          {t("by", { name: activity.actor.name })}
        </p>
      </div>
      <span className="shrink-0 self-start pt-0.5 text-[11px] text-foreground-muted tabular-nums">
        {timeAgo(activity.created_at, t)}
      </span>
    </li>
  );
}
