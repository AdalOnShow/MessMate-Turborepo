"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useGetMyMess } from "../../hooks/use-messes";
import { useGetMonthHistory, useGetMonthSummary } from "../../hooks/use-months";
import type { MonthInfo } from "../../hooks/use-months";
import { Calendar, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import {
  QueriesErrorState,
  QueryErrorState,
  failedQueries,
} from "../../components/feedback/QueryErrorState";

function MonthSummary({ month }: { month: MonthInfo }) {
  const t = useTranslations("pages.months");
  const { data: myMess } = useGetMyMess();
  const messId = myMess?.id;
  const summaryQuery = useGetMonthSummary(messId, month.id);
  const { data: summary, isLoading } = summaryQuery;
  const [expanded, setExpanded] = useState(false);

  // Time of day is included so months opened on the same date can be told
  // apart.
  const startDate = new Date(month.started_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const endDate = month.ended_at
    ? new Date(month.ended_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface-raised"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Calendar size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{month.title}</p>
            <p className="text-xs text-foreground-muted">
              {startDate}
              {endDate ? ` — ${endDate}` : " — Present"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-[5px] border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${
              month.month_status === "ACTIVE"
                ? "border-success/25 bg-success/10 text-success"
                : "border-border bg-surface-raised text-foreground-muted"
            }`}
          >
            {month.month_status === "ACTIVE" ? "Active" : "Archived"}
          </span>
          {expanded ? (
            <ChevronUp size={16} className="text-foreground-muted" />
          ) : (
            <ChevronDown size={16} className="text-foreground-muted" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : summaryQuery.isError && !summary ? (
            <QueryErrorState
              compact
              error={summaryQuery.error}
              onRetry={summaryQuery.refetch}
              isRetrying={summaryQuery.isFetching}
              resource="this month's summary"
            />
          ) : !summary || summary.member_summaries.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              {t("noSummaryDataAvailable")}
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-mono font-medium uppercase tracking-[0.1em] text-foreground-muted">
                {t("memberSummaries")}
              </p>
              <div className="-mx-1 overflow-x-auto px-1">
                <table className="w-full whitespace-nowrap text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 text-left text-xs font-semibold text-foreground-muted">
                        {t("member")}
                      </th>
                      <th className="pb-2 pl-4 text-right text-xs font-semibold text-foreground-muted">
                        {t("meals")}
                      </th>
                      <th className="pb-2 pl-4 text-right text-xs font-semibold text-foreground-muted">
                        {t("bill")}
                      </th>
                      <th className="pb-2 pl-4 text-right text-xs font-semibold text-foreground-muted">
                        {t("deposit")}
                      </th>
                      <th className="pb-2 pl-4 text-right text-xs font-semibold text-foreground-muted">
                        {t("balance")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.member_summaries.map((s) => (
                      <tr key={s.id} className="border-b border-border">
                        <td className="py-2">
                          <p className="font-medium text-foreground">
                            {s.user.name}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {s.user.email}
                          </p>
                        </td>
                        <td className="py-2 pl-4 text-right text-foreground">
                          {s.total_meals}
                        </td>
                        <td className="py-2 pl-4 text-right text-foreground">
                          ৳{s.final_bill.toLocaleString()}
                        </td>
                        <td className="py-2 pl-4 text-right text-foreground">
                          ৳{s.deposit_amount.toLocaleString()}
                        </td>
                        <td
                          className={`py-2 pl-4 text-right font-semibold ${
                            s.final_balance > 0
                              ? "text-success"
                              : s.final_balance < 0
                                ? "text-destructive"
                                : "text-foreground"
                          }`}
                        >
                          {s.final_balance > 0 ? "+" : ""}৳
                          {s.final_balance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MonthsPage() {
  const t = useTranslations("pages.months");
  const messQuery = useGetMyMess();
  const { data: myMess, isLoading: messLoading } = messQuery;
  const messId = myMess?.id;
  const monthsQuery = useGetMonthHistory(messId);
  const { data: months, isLoading: monthsLoading } = monthsQuery;

  if (messLoading || monthsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <p className="label-mono text-primary">{t("months")}</p>
        <h1 className="mt-2 heading-tight text-2xl text-foreground sm:text-3xl">
          {t("monthHistory")}
        </h1>
      </div>

      {failedQueries(messQuery, monthsQuery).length > 0 ? (
        <QueriesErrorState
          queries={[messQuery, monthsQuery]}
          resource="month history"
        />
      ) : !months || months.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <Calendar size={32} className="mx-auto mb-3 text-foreground-muted" />
          <p className="text-sm text-foreground-muted">
            {t("noMonthsFoundStart")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {months.map((month) => (
            <MonthSummary key={month.id} month={month} />
          ))}
        </div>
      )}
    </>
  );
}
