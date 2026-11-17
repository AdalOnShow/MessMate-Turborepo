"use client";

import { useTranslations } from "next-intl";
import type { useGetMonthMealSummary } from "@/app/hooks/use-meals";
import { formatCompact } from "@/app/lib/format";
import { QueryErrorState } from "../../feedback/QueryErrorState";
import { Skeleton } from "../../ui/skeleton";
import { UserAvatar } from "../UserAvatar";
import { Card, CardTitle } from "./shared";

/** Top five members by meals this month, as simple bars. */
export function MealsByMember({
  query,
}: {
  query: ReturnType<typeof useGetMonthMealSummary>;
}) {
  const t = useTranslations("dashboard.home");
  const members = query.data?.member_summaries?.slice(0, 5) ?? [];
  const max = Math.max(1, ...members.map((m) => m.total_meals));

  return (
    <Card>
      <CardTitle
        title={t("mealsByMember")}
        href="/dashboard/reports"
        linkLabel={t("reports")}
      />
      {query.isPending ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-2 flex-1 rounded-full" />
            </div>
          ))}
        </div>
      ) : query.isError && !query.data ? (
        <QueryErrorState
          compact
          error={query.error}
          onRetry={query.refetch}
          isRetrying={query.isFetching}
          resource="meal overview"
        />
      ) : members.length === 0 ? (
        <p className="py-4 text-center text-sm text-foreground-muted">
          {t("noMealsYet")}
        </p>
      ) : (
        <ul className="space-y-3">
          {members.map((m) => (
            <li key={m.member_id} className="flex items-center gap-3">
              <UserAvatar
                name={m.user.name}
                email={m.user.email}
                avatar={m.user.avatar}
                className="size-7 text-[10px]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm text-foreground">
                    {m.user.name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
                    {formatCompact(m.total_meals)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-raised">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-700"
                    style={{
                      width: `${Math.max((m.total_meals / max) * 100, 4)}%`,
                    }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
