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
import type { ActivityLogInfo } from "../../hooks/use-members";
import { useRecentActivities } from "../../hooks/use-members";
import { BentoCard, CardHeading } from "./bento";
import { QueryErrorState } from "../feedback/QueryErrorState";

const ACTION_META: Record<
  ActivityLogInfo["action"],
  { label: string; icon: ReactNode }
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
  const { data: activities, isLoading } = activitiesQuery;

  return (
    <BentoCard className="flex flex-col p-6 lg:col-span-3">
      <CardHeading icon={<Activity size={15} />} title={t("recentActivity")} />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-xl bg-surface-raised"
            />
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
        <div className="flex-1 space-y-1.5">
          {activities.slice(0, 6).map((a) => {
            const meta = ACTION_META[a.action];
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-raised"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {meta.label}
                  </p>
                  <p className="truncate text-xs text-foreground-muted">
                    {a.actor.name}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-foreground-muted/70">
                  {timeAgo(a.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <Activity size={28} className="mb-3 text-foreground-muted/40" />
          <p className="text-sm font-medium text-foreground">{t("noActivityYet")}</p>
          <p className="mt-1 max-w-[220px] text-xs text-foreground-muted">
            {t("actionsMessAppearHere")}
          </p>
        </div>
      )}
    </BentoCard>
  );
}
