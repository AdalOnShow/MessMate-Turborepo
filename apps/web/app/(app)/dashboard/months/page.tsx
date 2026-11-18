"use client";

import { PageTips } from "../../../components/help/PageTips";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useGetMyMess } from "../../../hooks/use-messes";
import {
  useGetMonthHistory,
  useGetMonthSummary,
} from "../../../hooks/use-months";
import type { MonthInfo, MonthSummaryInfo } from "../../../hooks/use-months";
import { Calendar, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import {
  QueriesErrorState,
  QueryErrorState,
  failedQueries,
} from "../../../components/feedback/QueryErrorState";
import { MonthSettings } from "../../../components/dashboard/MonthSettings";

const money = (n: number) =>
  `৳${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const signedMoney = (n: number) =>
  (n > 0 ? "+" : n < 0 ? "-" : "") + money(Math.abs(n));

const balanceClass = (n: number) =>
  n > 0 ? "text-success" : n < 0 ? "text-destructive" : "text-foreground";

// Time of day is included so months opened on the same date can be told apart.
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground-muted">
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${tone ?? "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function SummaryDetails({ summary }: { summary: MonthSummaryInfo }) {
  const t = useTranslations("pages.months");
  const { totals, member_summaries: members } = summary;

  const breakdown = [
    { label: t("bazaar"), value: totals.bazaar_cost },
    { label: t("shared"), value: totals.shared_cost },
    { label: t("individual"), value: totals.individual_cost },
    ...(totals.carried_in_balance > 0
      ? [{ label: t("carriedInBalance"), value: totals.carried_in_balance }]
      : []),
    ...(totals.carried_in_due > 0
      ? [{ label: t("carriedInDue"), value: totals.carried_in_due }]
      : []),
  ];

  const sum = (pick: (m: (typeof members)[number]) => number) =>
    members.reduce((acc, m) => acc + pick(m), 0);

  const th = "pb-2 pl-4 text-right text-xs font-semibold text-foreground-muted";
  const td = "py-2 pl-4 text-right text-foreground";

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-mono font-medium uppercase tracking-[0.1em] text-foreground-muted">
            {t("overview")}
          </p>
          <p className="text-xs text-foreground-muted">
            {t("membersCount", { count: totals.member_count })}
            {totals.closed_by
              ? ` · ${t("closedBy", { name: totals.closed_by.name })}`
              : ""}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label={t("mealRate")} value={money(totals.meal_rate)} />
          <Stat
            label={t("totalMeals")}
            value={totals.total_meals.toLocaleString("en-US")}
          />
          <Stat label={t("totalExpense")} value={money(totals.total_expense)} />
          <Stat
            label={t("totalDeposits")}
            value={money(totals.total_deposits)}
          />
          <Stat
            label={t("totalDue")}
            value={money(totals.total_due)}
            tone={totals.total_due > 0 ? "text-destructive" : undefined}
          />
          <Stat
            label={t("totalCredit")}
            value={money(totals.total_credit)}
            tone={totals.total_credit > 0 ? "text-success" : undefined}
          />
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-mono font-medium uppercase tracking-[0.1em] text-foreground-muted">
          {t("expenseBreakdown")}
        </p>
        <dl className="divide-y divide-border rounded-lg border border-border text-sm">
          {breakdown.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-3 py-2"
            >
              <dt className="text-foreground-muted">{row.label}</dt>
              <dd className="font-medium text-foreground">
                {money(row.value)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {members.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          {t("noSummaryDataAvailable")}
        </p>
      ) : (
        <section className="space-y-3">
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
                  <th className={th}>{t("meals")}</th>
                  <th className={th}>{t("mealCost")}</th>
                  <th className={th}>{t("shared")}</th>
                  <th className={th}>{t("individual")}</th>
                  <th className={th}>{t("bill")}</th>
                  <th className={th}>{t("deposit")}</th>
                  <th className={th}>{t("carriedIn")}</th>
                  <th className={th}>{t("balance")}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((s) => (
                  <tr key={s.id} className="border-b border-border">
                    <td className="py-2">
                      <p className="flex items-center gap-2 font-medium text-foreground">
                        {s.user.name}
                        {s.removed ? (
                          <span className="rounded border border-border px-1.5 py-px text-[10px] font-semibold uppercase text-foreground-muted">
                            {t("removed")}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {s.user.email}
                      </p>
                    </td>
                    <td className={td}>{s.total_meals}</td>
                    <td className={td}>{money(s.meal_cost)}</td>
                    <td className={td}>{money(s.shared_cost)}</td>
                    <td className={td}>{money(s.individual_cost)}</td>
                    <td className={`${td} font-medium`}>
                      {money(s.final_bill)}
                    </td>
                    <td className={td}>{money(s.deposit_amount)}</td>
                    <td
                      className={`py-2 pl-4 text-right ${balanceClass(s.carried_in)}`}
                    >
                      {s.carried_in === 0 ? "—" : signedMoney(s.carried_in)}
                    </td>
                    <td
                      className={`py-2 pl-4 text-right font-semibold ${balanceClass(s.final_balance)}`}
                    >
                      {signedMoney(s.final_balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="pt-2 text-foreground">{t("total")}</td>
                  <td className={td}>{sum((m) => m.total_meals)}</td>
                  <td className={td}>{money(sum((m) => m.meal_cost))}</td>
                  <td className={td}>{money(sum((m) => m.shared_cost))}</td>
                  <td className={td}>{money(sum((m) => m.individual_cost))}</td>
                  <td className={td}>{money(sum((m) => m.final_bill))}</td>
                  <td className={td}>{money(sum((m) => m.deposit_amount))}</td>
                  <td className={td} />
                  <td
                    className={`py-2 pl-4 text-right ${balanceClass(sum((m) => m.final_balance))}`}
                  >
                    {signedMoney(sum((m) => m.final_balance))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function ArchivedSummary({
  messId,
  monthId,
}: {
  messId: string | undefined;
  monthId: string;
}) {
  const summaryQuery = useGetMonthSummary(messId, monthId);
  const { data: summary, isLoading } = summaryQuery;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (summaryQuery.isError || !summary) {
    return (
      <QueryErrorState
        compact
        error={summaryQuery.error}
        onRetry={summaryQuery.refetch}
        isRetrying={summaryQuery.isFetching}
        resource="this month's summary"
      />
    );
  }

  return <SummaryDetails summary={summary} />;
}

function MonthRow({
  month,
  messId,
}: {
  month: MonthInfo;
  messId: string | undefined;
}) {
  const t = useTranslations("pages.months");
  const [expanded, setExpanded] = useState(false);
  const isActive = month.month_status === "ACTIVE";

  const header = (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Calendar size={18} className="text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{month.title}</p>
          <p className="text-xs text-foreground-muted">
            {formatDateTime(month.started_at)}
            {" — "}
            {month.ended_at ? formatDateTime(month.ended_at) : t("present")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`rounded-[5px] border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${
            isActive
              ? "border-success/25 bg-success/10 text-success"
              : "border-border bg-surface-raised text-foreground-muted"
          }`}
        >
          {isActive ? t("active") : t("archived")}
        </span>
        {isActive ? null : expanded ? (
          <ChevronUp size={16} className="text-foreground-muted" />
        ) : (
          <ChevronDown size={16} className="text-foreground-muted" />
        )}
      </div>
    </>
  );

  // An active month has no summary yet: it is generated when the month closes.
  if (isActive) {
    return (
      <div className="rounded-xl border border-border bg-surface">
        <div className="flex w-full items-center justify-between p-4">
          {header}
        </div>
        <p className="border-t border-border px-4 py-3 text-sm text-foreground-muted">
          {t("summaryAfterClose")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface-raised"
      >
        {header}
      </button>

      {expanded && (
        <div className="border-t border-border p-4">
          <ArchivedSummary messId={messId} monthId={month.id} />
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
  const isManager = myMess?.current_user_role === "MANAGER";
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
        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 className="heading-tight text-2xl text-foreground sm:text-3xl">
            {t("monthHistory")}
          </h1>
          <PageTips page="months" />
        </div>
      </div>

      {failedQueries(messQuery, monthsQuery).length > 0 ? (
        <QueriesErrorState
          queries={[messQuery, monthsQuery]}
          resource="month history"
        />
      ) : (
        <div className="space-y-6">
          {isManager && messId ? <MonthSettings messId={messId} /> : null}

          {!months || months.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <Calendar
                size={32}
                className="mx-auto mb-3 text-foreground-muted"
              />
              <p className="text-sm text-foreground-muted">
                {isManager ? t("noMonthsFoundStart") : t("noMonthsFoundMember")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {months.map((month) => (
                <MonthRow key={month.id} month={month} messId={messId} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
