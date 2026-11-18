"use client";

import { useTranslations } from "next-intl";
import { Activity } from "lucide-react";
import { useRecentActivities } from "@/app/hooks/use-members";
import { QueryErrorState } from "../../feedback/QueryErrorState";
import { Skeleton } from "../../ui/skeleton";
import { ActivityItem } from "../activity/ActivityItem";
import { Card, CardTitle } from "./shared";

export function RecentActivity({ messId }: { messId: string | undefined }) {
  const t = useTranslations("dashboard.recentActivity");
  const activitiesQuery = useRecentActivities(messId);
  const { data: activities, isPending } = activitiesQuery;

  return (
    <Card>
      <CardTitle
        title={t("recentActivity")}
        href="/dashboard/activity"
        linkLabel={t("viewAll")}
      />

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
          {activities.slice(0, 6).map((a) => (
            <ActivityItem key={a.id} activity={a} />
          ))}
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
