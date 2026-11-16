"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { useGetMyMess } from "@/app/hooks/use-messes";
import { useGetActiveMonth } from "@/app/hooks/use-months";
import { Skeleton } from "../../ui/skeleton";

/** Small month status at the top of the dashboard; opens month history. */
export function MonthPill() {
  const t = useTranslations("dashboard.home");
  const { data: myMess } = useGetMyMess();
  const monthQuery = useGetActiveMonth(myMess?.id);
  const month = monthQuery.data;

  if (!myMess) return null;
  if (monthQuery.isPending)
    return <Skeleton className="h-7 w-44 rounded-full" />;
  // The page shows the error state; don't claim "no month" when unknown.
  if (monthQuery.isError && !month) return null;

  const since = month?.started_at
    ? new Date(month.started_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Link
      href="/dashboard/months"
      aria-label={t("monthHistory")}
      className="inline-flex h-7 max-w-full items-center gap-2 rounded-full border border-border bg-surface pr-2 pl-3 text-xs font-medium text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground"
    >
      {month ? (
        <>
          <span className="pulse-dot shrink-0" aria-hidden="true" />
          <span className="truncate font-semibold text-foreground">
            {month.title}
          </span>
          {since ? (
            <span className="hidden shrink-0 min-[360px]:inline">
              · {t("since", { date: since })}
            </span>
          ) : null}
        </>
      ) : (
        <>
          <span
            className="size-1.5 shrink-0 rounded-full bg-accent-warm"
            aria-hidden="true"
          />
          <span className="truncate">{t("noActiveMonth")}</span>
        </>
      )}
      <ChevronRight size={13} className="shrink-0" aria-hidden="true" />
    </Link>
  );
}
