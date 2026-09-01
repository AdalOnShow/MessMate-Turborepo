"use client";

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

const ACTION_META: Record<
  ActivityLogInfo["action"],
  { label: string; icon: ReactNode }
> = {
  MEMBER_ADDED: { label: "Member added", icon: <UserPlus size={14} /> },
  MEMBER_REMOVED: { label: "Member removed", icon: <UserMinus size={14} /> },
  MANAGER_ASSIGNED: { label: "Manager assigned", icon: <Crown size={14} /> },
  MEAL_ADDED: { label: "Meals added", icon: <ChefHat size={14} /> },
  MEAL_UPDATED: { label: "Meals updated", icon: <ChefHat size={14} /> },
  MEAL_DELETED: { label: "Meals deleted", icon: <ChefHat size={14} /> },
  EXPENSE_ADDED: { label: "Expense added", icon: <Receipt size={14} /> },
  EXPENSE_UPDATED: { label: "Expense updated", icon: <Receipt size={14} /> },
  EXPENSE_DELETED: { label: "Expense deleted", icon: <Receipt size={14} /> },
  DEPOSIT_ADDED: { label: "Deposit added", icon: <Landmark size={14} /> },
  DEPOSIT_UPDATED: { label: "Deposit updated", icon: <Landmark size={14} /> },
  MONTH_OPENED: { label: "Month opened", icon: <Activity size={14} /> },
  MONTH_CLOSED: { label: "Month closed", icon: <Activity size={14} /> },
  MEMBER_BALANCE_CREATED: {
    label: "Balance created",
    icon: <Users size={14} />,
  },
  DEFAULT_MEALS_UPDATED: {
    label: "Default meals updated",
    icon: <ChefHat size={14} />,
  },
  BAZAAR_SUBMITTED: {
    label: "Bazaar submitted",
    icon: <ShoppingCart size={14} />,
  },
  BAZAAR_UPDATED: { label: "Bazaar updated", icon: <ShoppingCart size={14} /> },
  BAZAAR_APPROVED: {
    label: "Bazaar approved",
    icon: <ShoppingCart size={14} />,
  },
  BAZAAR_REJECTED: {
    label: "Bazaar rejected",
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
  const { data: activities, isLoading } = useRecentActivities(messId);

  return (
    <BentoCard className="flex flex-col p-6 lg:col-span-3">
      <CardHeading icon={<Activity size={15} />} title="Recent activity" />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-xl bg-foreground-muted/5"
            />
          ))}
        </div>
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
          <p className="text-sm font-medium text-foreground">No activity yet</p>
          <p className="mt-1 max-w-[220px] text-xs text-foreground-muted">
            Actions in your mess will appear here.
          </p>
        </div>
      )}
    </BentoCard>
  );
}
