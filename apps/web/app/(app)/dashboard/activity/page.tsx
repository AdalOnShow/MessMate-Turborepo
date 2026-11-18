"use client";

import { PageTips } from "../../../components/help/PageTips";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import type { ActivityCategory } from "@repo/shared";
import { useGetMyMess } from "../../../hooks/use-messes";
import { useActivityHistory } from "../../../hooks/use-reports";
import { useUnreadNotifications } from "../../../hooks/use-notifications";
import { ActivityItem } from "../../../components/dashboard/activity/ActivityItem";
import {
  FilterChips,
  LoadMore,
} from "../../../components/dashboard/reports/ListControls";
import { QueryErrorState } from "../../../components/feedback/QueryErrorState";
import { Skeleton } from "../../../components/ui/skeleton";

type Filter = "all" | ActivityCategory;

const CATEGORY_LABEL = {
  all: "catAll",
  meals: "catMeals",
  expenses: "catExpenses",
  deposits: "catDeposits",
  bazaar: "catBazaar",
  members: "catMembers",
  months: "catMonths",
} as const satisfies Record<Filter, string>;

/** Same shape as the loaded page: filter chips, then activity rows. */
function ActivitySkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="flex gap-2 overflow-hidden">
        {["w-14", "w-16", "w-20", "w-16", "w-14", "w-[4.5rem]"].map((w, i) => (
          <Skeleton key={i} className={`h-8 shrink-0 rounded-full ${w}`} />
        ))}
      </div>
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface px-3 py-1">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="flex items-center gap-3 px-1 py-2.5">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-2/5 rounded" />
              <Skeleton className="h-3 w-3/5 rounded" />
              <Skeleton className="h-3 w-1/4 rounded" />
            </div>
            <Skeleton className="h-3 w-10 shrink-0 self-start rounded" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActivityList({ messId }: { messId: string }) {
  const t = useTranslations("dashboard.recentActivity");
  const [filter, setFilter] = useState<Filter>("all");
  const query = useActivityHistory(
    messId,
    filter === "all" ? undefined : filter,
  );

  if (query.isPending) return <ActivitySkeleton />;
  if (query.isError && !query.data) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={query.refetch}
        isRetrying={query.isFetching}
        resource="activity"
      />
    );
  }

  const pages = query.data?.pages ?? [];
  const first = pages[0];
  const rows = pages.flatMap((p) => p.items);
  const counts = first?.category_counts;

  if (filter === "all" && rows.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-border bg-surface py-12 text-center">
        <Activity size={24} className="mb-2 text-foreground-muted/40" />
        <p className="text-sm font-medium text-foreground">
          {t("noActivityYet")}
        </p>
        <p className="mt-1 max-w-[240px] text-xs text-foreground-muted">
          {t("actionsMessAppearHere")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <FilterChips
        value={filter}
        onChange={setFilter}
        options={(Object.keys(CATEGORY_LABEL) as Filter[]).map((key) => ({
          key,
          label: t(CATEGORY_LABEL[key]),
          count: counts?.[key] ?? 0,
        }))}
      />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-foreground-muted">
          {t("noActivityOfType")}
        </div>
      ) : (
        <ul
          className={`divide-y divide-border rounded-xl border border-border bg-surface px-3 py-1 transition-opacity ${
            query.isPlaceholderData ? "opacity-60" : ""
          }`}
        >
          {rows.map((a) => (
            <ActivityItem key={a.id} activity={a} />
          ))}
        </ul>
      )}

      <LoadMore
        shown={rows.length}
        total={first?.total ?? rows.length}
        hasMore={!!query.hasNextPage}
        loading={query.isFetchingNextPage}
        onClick={() => void query.fetchNextPage()}
      />
    </div>
  );
}

/**
 * Notifications: every activity of the mess, 10 per page, filterable by
 * category. Opening it clears the unread badge on the bell.
 */
export default function ActivityPage() {
  const t = useTranslations("dashboard.recentActivity");
  const messQuery = useGetMyMess();
  const { data: myMess, isLoading } = messQuery;
  const { markSeen } = useUnreadNotifications();

  // Opening the page reads every notification.
  useEffect(() => {
    markSeen();
  }, [markSeen]);

  return (
    <>
      <div className="mb-6">
        <p className="label-mono text-primary">{t("activity")}</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 className="heading-tight text-2xl text-foreground sm:text-3xl">
            {t("allActivity")}
          </h1>
          <PageTips page="activity" />
        </div>
        <p className="mt-1 text-sm text-foreground-muted">
          {t("activityHint")}
        </p>
      </div>

      {isLoading ? (
        <ActivitySkeleton />
      ) : messQuery.isError && !myMess ? (
        <QueryErrorState
          error={messQuery.error}
          onRetry={messQuery.refetch}
          isRetrying={messQuery.isFetching}
          resource="your mess"
        />
      ) : myMess ? (
        <ActivityList messId={myMess.id} />
      ) : null}
    </>
  );
}
