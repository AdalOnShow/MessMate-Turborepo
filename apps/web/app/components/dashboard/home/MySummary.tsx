"use client";

import { useTranslations } from "next-intl";
import type { useMemberDashboard } from "@/app/hooks/use-members";
import { formatMoney } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";
import { QueryErrorState } from "../../feedback/QueryErrorState";
import { Skeleton } from "../../ui/skeleton";
import { Card, CardTitle, balanceTone, toneText } from "./shared";

function Row({
  label,
  hint,
  value,
  strong,
  className,
}: {
  label: string;
  hint?: string;
  value: string;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-3 py-2",
        className,
      )}
    >
      <span className="min-w-0">
        <span
          className={cn(
            "block text-sm",
            strong ? "font-semibold text-foreground" : "text-foreground-muted",
          )}
        >
          {label}
        </span>
        {hint ? (
          <span className="block text-[11px] text-foreground-muted/80">
            {hint}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "shrink-0 tabular-nums",
          strong
            ? "text-base font-bold text-foreground"
            : "text-sm font-medium text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * The signed-in user's own bill. Managers get their balance and deposits
 * too (members already see those in the hero).
 */
export function MySummary({
  query,
  withBalance,
}: {
  query: ReturnType<typeof useMemberDashboard>;
  withBalance: boolean;
}) {
  const t = useTranslations("dashboard.home");
  const data = query.data;

  return (
    <Card>
      <CardTitle
        title={withBalance ? t("mySummary") : t("billBreakdown")}
        href="/dashboard/members"
        linkLabel={t("everyoneSummary")}
      />
      {query.isPending ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-full rounded" />
          ))}
        </div>
      ) : !data ? (
        <QueryErrorState
          compact
          error={query.error}
          onRetry={query.refetch}
          isRetrying={query.isFetching}
          resource="your summary"
        />
      ) : (
        <>
          {withBalance ? (
            <div className="mb-2 flex items-end justify-between gap-3 rounded-xl bg-surface-raised px-3.5 py-3">
              <div>
                <p className="text-[11px] font-medium text-foreground-muted">
                  {t("myBalance")}
                </p>
                <p
                  className={cn(
                    "text-2xl font-extrabold tracking-tight tabular-nums",
                    toneText[balanceTone(data.current_balance)],
                  )}
                >
                  {data.current_balance < 0 ? "−" : ""}
                  {formatMoney(Math.abs(data.current_balance))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-medium text-foreground-muted">
                  {t("deposits")}
                </p>
                <p className="text-sm font-semibold text-foreground tabular-nums">
                  {formatMoney(data.deposit_amount)}
                </p>
              </div>
            </div>
          ) : null}

          <div className="divide-y divide-border">
            <Row
              label={t("mealCost")}
              hint={t("mealCostHint", {
                meals: data.total_meals,
                rate: formatMoney(Math.round(data.meal_rate ?? 0)),
              })}
              value={formatMoney(data.meal_cost)}
            />
            <Row
              label={t("sharedCost")}
              value={formatMoney(data.shared_cost)}
            />
            <Row
              label={t("individualCost")}
              value={formatMoney(data.individual_cost)}
            />
            <Row
              label={t("totalBill")}
              value={formatMoney(data.final_bill)}
              strong
              className="pt-3"
            />
          </div>
        </>
      )}
    </Card>
  );
}
