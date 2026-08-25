"use client";

import { useState } from "react";
import { useGetMyMess } from "../../hooks/use-messes";
import { useGetMonthHistory, useGetMonthSummary } from "../../hooks/use-months";
import type { MonthInfo } from "../../hooks/use-months";
import { Calendar, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

function MonthSummary({ month }: { month: MonthInfo }) {
  const { data: myMess } = useGetMyMess();
  const messId = myMess?.id;
  const { data: summary, isLoading } = useGetMonthSummary(messId, month.id);
  const [expanded, setExpanded] = useState(false);

  const startDate = new Date(month.started_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const endDate = month.ended_at
    ? new Date(month.ended_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="rounded-xl border border-foreground-muted/15 bg-surface">
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
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              month.month_status === "ACTIVE"
                ? "bg-green-500/15 text-green-500"
                : "bg-foreground-muted/15 text-foreground-muted"
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
        <div className="border-t border-foreground-muted/10 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : !summary || summary.member_summaries.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              No summary data available for this month.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Member Summaries
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-foreground-muted/10">
                      <th className="pb-2 text-left text-xs font-semibold text-foreground-muted">
                        Member
                      </th>
                      <th className="pb-2 text-right text-xs font-semibold text-foreground-muted">
                        Meals
                      </th>
                      <th className="pb-2 text-right text-xs font-semibold text-foreground-muted">
                        Bill
                      </th>
                      <th className="pb-2 text-right text-xs font-semibold text-foreground-muted">
                        Deposit
                      </th>
                      <th className="pb-2 text-right text-xs font-semibold text-foreground-muted">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.member_summaries.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-foreground-muted/5"
                      >
                        <td className="py-2">
                          <p className="font-medium text-foreground">
                            {s.user.name}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {s.user.email}
                          </p>
                        </td>
                        <td className="py-2 text-right text-foreground">
                          {s.total_meals}
                        </td>
                        <td className="py-2 text-right text-foreground">
                          ৳{s.final_bill.toLocaleString()}
                        </td>
                        <td className="py-2 text-right text-foreground">
                          ৳{s.deposit_amount.toLocaleString()}
                        </td>
                        <td
                          className={`py-2 text-right font-semibold ${
                            s.final_balance > 0
                              ? "text-green-500"
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
  const { data: myMess, isLoading: messLoading } = useGetMyMess();
  const messId = myMess?.id;
  const { data: months, isLoading: monthsLoading } = useGetMonthHistory(messId);

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
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Months
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">
          Month History
        </h1>
      </div>

      {!months || months.length === 0 ? (
        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
          <Calendar size={32} className="mx-auto mb-3 text-foreground-muted" />
          <p className="text-sm text-foreground-muted">
            No months found. Start a new month from the dashboard.
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
