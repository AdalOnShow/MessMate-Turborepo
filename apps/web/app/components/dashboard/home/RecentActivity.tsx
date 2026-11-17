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
  UserPlus,
  UserMinus,
  Users,
} from "lucide-react";
import type { ActivityLogInfo } from "@/app/hooks/use-members";
import { useRecentActivities } from "@/app/hooks/use-members";
import { QueryErrorState } from "../../feedback/QueryErrorState";
import { Skeleton } from "../../ui/skeleton";
import { UserAvatar } from "../UserAvatar";
import { Card, CardTitle } from "./shared";

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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function RecentActivity({ messId }: { messId: string | undefined }) {
  const t = useTranslations("dashboard.recentActivity");
  const activitiesQuery = useRecentActivities(messId);
  const { data: activities, isPending } = activitiesQuery;

  return (
    <Card>
      <CardTitle title={t("recentActivity")} />

      {isPending ? (
        <div className="space-y-4 py-1">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/3 rounded" />
                <Skeleton className="h-3 w-1/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : activitiesQuery.isError && !activities ? (
        <QueryErrorState
          compact
          error={activitiesQuery.error}
          onRetry={activitiesQuery.refetch}
          isRetrying={activitiesQuery.isFetching}
          resource="recent activity"
        />
      ) : activities && activities.length > 0 ? (
        <ul className="-mx-1">
          {activities.slice(0, 6).map((a) => {
            const meta = ACTION_META[a.action];
            return (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-xl px-1 py-2"
              >
                <span className="relative shrink-0">
                  <UserAvatar
                    name={a.actor.name}
                    email={a.actor.email}
                    avatar={a.actor.avatar}
                    className="size-9 text-xs"
                  />
                  <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-surface bg-surface-raised text-primary [&_svg]:size-2.5">
                    {meta?.icon ?? <Activity />}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {meta ? t(meta.label) : a.action}
                  </p>
                  <p className="truncate text-xs text-foreground-muted">
                    {a.actor.name}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-foreground-muted tabular-nums">
                  {timeAgo(a.created_at)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center py-8 text-center">
          <Activity size={24} className="mb-2 text-foreground-muted/40" />
          <p className="text-sm font-medium text-foreground">
            {t("noActivityYet")}
          </p>
          <p className="mt-1 max-w-[220px] text-xs text-foreground-muted">
            {t("actionsMessAppearHere")}
          </p>
        </div>
      )}
    </Card>
  );
}
