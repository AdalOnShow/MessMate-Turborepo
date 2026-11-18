"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import type { ActivityCategory } from "@repo/shared";
import { useGetMyMess } from "../../hooks/use-messes";
import { useActivityHistory } from "../../hooks/use-reports";
import { ActivityItem } from "../../components/dashboard/activity/ActivityItem";
import {
  FilterChips,
  LoadMore,
} from "../../components/dashboard/reports/ListControls";
import { QueryErrorState } from "../../components/feedback/QueryErrorState";

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

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
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

  if (query.isPending) return <Spinner />;
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

/** Every activity of the mess, 10 per page, filterable by category. */
export default function ActivityPage() {
  const t = useTranslations("dashboard.recentActivity");
  const messQuery = useGetMyMess();
  const { data: myMess, isLoading } = messQuery;

  return (
    <>
      <div className="mb-6">
        <p className="label-mono text-primary">{t("activity")}</p>
        <h1 className="mt-2 heading-tight text-2xl text-foreground sm:text-3xl">
          {t("allActivity")}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {t("activityHint")}
        </p>
      </div>

      {isLoading ? (
        <Spinner />
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
