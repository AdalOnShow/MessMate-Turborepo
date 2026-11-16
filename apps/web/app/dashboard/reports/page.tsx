"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Calendar,
  Loader2,
  ReceiptText,
  User,
  Utensils,
  WalletCards,
} from "lucide-react";
import { useGetMyMess } from "../../hooks/use-messes";
import {
  useGetActiveMonth,
  useGetMonthHistory,
  useGetMonthSummary,
  type MonthInfo,
} from "../../hooks/use-months";
import { useGetMonthMealSummary } from "../../hooks/use-meals";
import { useExpenseSummary } from "../../hooks/use-expenses";
import { useDepositSummary } from "../../hooks/use-deposits";
import { useMemberCalculations } from "../../hooks/use-members";
import { formatMoney } from "../../lib/format";
import {
  QueriesErrorState,
  QueryErrorState,
  failedQueries,
} from "../../components/feedback/QueryErrorState";

type Tab = "month" | "meals" | "expenses" | "deposits" | "members";

interface MemberRow {
  member_id: string;
  user: { id: string; name: string; email: string; avatar: string | null };
  total_meals: number;
  meal_cost: number;
  shared_cost: number;
  individual_cost: number;
  deposit_amount: number;
  final_bill: number;
  final_balance: number;
  previous_balance?: number;
  current_balance?: number;
}

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 text-center">
      <p className="text-sm text-foreground-muted">{message}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface p-2.5 sm:p-3">
      <p className="text-xs font-medium leading-tight text-foreground-muted">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-lg font-bold tabular-nums sm:text-xl ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function BalanceBadge({ value }: { value: number }) {
  const color =
    value > 0
      ? "text-success"
      : value < 0
        ? "text-destructive"
        : "text-foreground";
  return (
    <span className={`font-semibold ${color}`}>
      {value > 0 ? "+" : ""}
      {formatMoney(value)}
    </span>
  );
}

// Older data can contain several months with the same title; add the date
// range to those so each option is distinguishable.
function monthOptionLabel(month: MonthInfo, all: MonthInfo[]): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  const duplicated = all.some(
    (other) => other.id !== month.id && other.title === month.title,
  );
  const range = duplicated
    ? ` · ${fmt(month.started_at)} – ${month.ended_at ? fmt(month.ended_at) : "now"}`
    : "";
  return `${month.title}${range}${month.month_status === "ACTIVE" ? " (Active)" : ""}`;
}

function UserCell({ name, email }: { name: string; email: string }) {
  return (
    <div>
      <p className="truncate font-medium text-foreground">{name}</p>
      <p className="hidden truncate text-xs text-foreground-muted md:block">
        {email}
      </p>
    </div>
  );
}

function Th({ label }: { label: string }) {
  return (
    <th className="whitespace-nowrap px-4 pb-2 pt-3 text-right text-xs font-semibold text-foreground-muted">
      {label}
    </th>
  );
}

function ThLeft({ label }: { label: string }) {
  return (
    <th className="whitespace-nowrap px-4 pb-2 pt-3 text-left text-xs font-semibold text-foreground-muted">
      {label}
    </th>
  );
}

function MonthSummaryView({
  messId,
  monthId,
}: {
  messId: string;
  monthId: string;
}) {
  const t = useTranslations("pages.reports");
  const query = useGetMonthSummary(messId, monthId);
  const { data, isLoading } = query;

  if (isLoading) return <LoadingBlock />;
  if (query.isError && !data) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={query.refetch}
        isRetrying={query.isFetching}
        resource="this report"
      />
    );
  }

  if (!data || data.member_summaries.length === 0) {
    return <EmptyBlock message={t("noSummaryDataAvailable")} />;
  }

  return (
    <div className="space-y-4">
      <StatCard
        label={t("members")}
        value={String(data.member_summaries.length)}
      />
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="table-sticky-first w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <ThLeft label={t("member")} />
              <Th label={t("meals")} />
              <Th label={t("mealCost")} />
              <Th label={t("shared")} />
              <Th label={t("individual")} />
              <Th label={t("bill")} />
              <Th label={t("deposit")} />
              <Th label={t("balance")} />
            </tr>
          </thead>
          <tbody>
            {data.member_summaries.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <UserCell name={s.user.name} email={s.user.email} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                  {s.total_meals}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                  {formatMoney(s.meal_cost)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                  {formatMoney(s.shared_cost)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                  {formatMoney(s.individual_cost)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-foreground">
                  {formatMoney(s.final_bill)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                  {formatMoney(s.deposit_amount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <BalanceBadge value={s.final_balance} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MealsSummaryView({
  messId,
  monthId,
}: {
  messId: string;
  monthId: string;
}) {
  const t = useTranslations("pages.reports");
  const query = useGetMonthMealSummary(messId, monthId);
  const { data, isLoading } = query;

  if (isLoading) return <LoadingBlock />;
  if (query.isError && !data) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={query.refetch}
        isRetrying={query.isFetching}
        resource="this report"
      />
    );
  }

  if (!data || data.member_summaries.length === 0) {
    return <EmptyBlock message={t("noMealEntriesRecorded")} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard label={t("totalMeals")} value={String(data.total_meals)} />
        <StatCard label={t("activeDays")} value={String(data.active_days)} />
        <StatCard label={t("entries")} value={String(data.total_entries)} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="table-sticky-first w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <ThLeft label={t("member")} />
              <Th label={t("meals")} />
              <Th label={t("entries")} />
            </tr>
          </thead>
          <tbody>
            {data.member_summaries.map((s) => (
              <tr
                key={s.member_id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3">
                  <UserCell name={s.user.name} email={s.user.email} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-foreground">
                  {s.total_meals}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                  {s.entry_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpensesSummaryView({
  messId,
  monthId,
}: {
  messId: string;
  monthId: string;
}) {
  const t = useTranslations("pages.reports");
  const query = useExpenseSummary(messId, monthId);
  const { data, isLoading } = query;

  if (isLoading) return <LoadingBlock />;
  if (query.isError && !data) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={query.refetch}
        isRetrying={query.isFetching}
        resource="this report"
      />
    );
  }

  if (!data || data.count === 0) {
    return <EmptyBlock message={t("noExpensesRecordedMonth")} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label={t("total")}
          value={formatMoney(data.total)}
          highlight
        />
        <StatCard label={t("shared")} value={formatMoney(data.shared_total)} />
        <StatCard
          label={t("individual")}
          value={formatMoney(data.individual_total)}
        />
        <StatCard label={t("bazaar")} value={formatMoney(data.bazaar_total)} />
        <StatCard label={t("count")} value={String(data.count)} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="table-sticky-first w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <ThLeft label={t("member")} />
              <Th label={t("sharedCost")} />
              <Th label={t("individual")} />
              <Th label={t("total")} />
            </tr>
          </thead>
          <tbody>
            {data.per_member.map((m) => (
              <tr
                key={m.member_id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3">
                  <UserCell name={m.user.name} email={m.user.email} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                  {formatMoney(m.shared_cost)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                  {formatMoney(m.individual_cost)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-foreground">
                  {formatMoney(m.total_cost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DepositsSummaryView({
  messId,
  monthId,
}: {
  messId: string;
  monthId: string;
}) {
  const t = useTranslations("pages.reports");
  const query = useDepositSummary(messId, monthId);
  const { data, isLoading } = query;

  if (isLoading) return <LoadingBlock />;
  if (query.isError && !data) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={query.refetch}
        isRetrying={query.isFetching}
        resource="this report"
      />
    );
  }

  if (!data || data.count === 0) {
    return <EmptyBlock message={t("noDepositsRecordedMonth")} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label={t("totalDeposits")}
          value={formatMoney(data.total)}
          highlight
        />
        <StatCard label={t("transactions")} value={String(data.count)} />
        <StatCard
          label={t("depositors")}
          value={String(data.per_member.length)}
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="table-sticky-first w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <ThLeft label={t("member")} />
              <Th label={t("count")} />
              <Th label={t("amount")} />
            </tr>
          </thead>
          <tbody>
            {data.per_member.map((m) => (
              <tr
                key={m.member_id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3">
                  <UserCell name={m.user.name} email={m.user.email} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                  {m.count}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-foreground">
                  {formatMoney(m.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MembersSummaryView({
  messId,
  month,
}: {
  messId: string;
  month: MonthInfo;
}) {
  const t = useTranslations("pages.reports");
  const isActive = month.month_status === "ACTIVE";
  const calcQuery = useMemberCalculations(messId);
  const summaryQuery = useGetMonthSummary(
    messId,
    isActive ? undefined : month.id,
  );
  const { data: calc, isLoading: calcLoading } = calcQuery;
  const { data: summary, isLoading: summaryLoading } = summaryQuery;

  if (isActive ? calcLoading : summaryLoading) return <LoadingBlock />;
  const relevantQuery = isActive ? calcQuery : summaryQuery;
  if (relevantQuery.isError && relevantQuery.data === undefined) {
    return (
      <QueryErrorState
        error={relevantQuery.error}
        onRetry={relevantQuery.refetch}
        isRetrying={relevantQuery.isFetching}
        resource="member report"
      />
    );
  }

  const rows: MemberRow[] = isActive
    ? (calc?.items ?? [])
    : (summary?.member_summaries ?? []);

  if (rows.length === 0) {
    return (
      <EmptyBlock
        message={
          isActive ? t("noMemberDataAvailable") : t("noSummaryAvailableMonth")
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-muted">
        {isActive
          ? t("liveCalculationsCurrentActive")
          : t("calculationsFromArchivedMonth")}
      </p>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="table-sticky-first w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <ThLeft label={t("member")} />
              <Th label={t("meals")} />
              <Th label={t("mealCost")} />
              <Th label={t("shared")} />
              <Th label={t("individual")} />
              <Th label={t("deposit")} />
              <Th label={t("bill")} />
              <Th label={t("balance")} />
              {isActive && <Th label={t("carried")} />}
              {isActive && <Th label={t("current")} />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.member_id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3">
                  <UserCell name={row.user.name} email={row.user.email} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                  {row.total_meals}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                  {formatMoney(row.meal_cost)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                  {formatMoney(row.shared_cost)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                  {formatMoney(row.individual_cost)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                  {formatMoney(row.deposit_amount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-foreground">
                  {formatMoney(row.final_bill)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <BalanceBadge value={row.final_balance} />
                </td>
                {isActive && (
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <BalanceBadge value={row.previous_balance ?? 0} />
                  </td>
                )}
                {isActive && (
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <BalanceBadge value={row.current_balance ?? 0} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const t = useTranslations("pages.reports");
  const messQuery = useGetMyMess();
  const { data: myMess, isLoading: messLoading } = messQuery;
  const messId = myMess?.id;
  const { data: activeMonth } = useGetActiveMonth(messId);
  const monthsQuery = useGetMonthHistory(messId);
  const { data: months, isLoading: monthsLoading } = monthsQuery;

  const [selectedMonthId, setSelectedMonthId] = useState<string | undefined>(
    undefined,
  );
  const [activeTab, setActiveTab] = useState<Tab>("month");

  useEffect(() => {
    if (!selectedMonthId && activeMonth?.id) {
      setSelectedMonthId(activeMonth.id);
    }
  }, [selectedMonthId, activeMonth?.id]);

  const selectedMonth = useMemo<MonthInfo | undefined>(
    () => months?.find((m) => m.id === selectedMonthId),
    [months, selectedMonthId],
  );

  const tabs: { key: Tab; label: string; icon: typeof Calendar }[] = [
    { key: "month", label: t("monthSummary"), icon: BarChart3 },
    { key: "meals", label: "Meals", icon: Utensils },
    { key: "expenses", label: "Expenses", icon: ReceiptText },
    { key: "deposits", label: "Deposits", icon: WalletCards },
    { key: "members", label: "Members", icon: User },
  ];

  if (messLoading || monthsLoading) return <LoadingBlock />;

  if (failedQueries(messQuery, monthsQuery).length > 0) {
    return (
      <>
        <PageHeader />
        <QueriesErrorState
          queries={[messQuery, monthsQuery]}
          resource="reports"
        />
      </>
    );
  }

  if (!months || months.length === 0) {
    return (
      <>
        <PageHeader />
        <EmptyBlock message={t("noMonthsFoundStart")} />
      </>
    );
  }

  return (
    <>
      <PageHeader />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="no-scrollbar flex w-full snap-x gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1 sm:w-auto sm:flex-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 snap-start items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-1 sm:rounded-md sm:px-3 sm:py-2 ${
                  activeTab === tab.key
                    ? "bg-primary text-white"
                    : "text-foreground-muted hover:bg-surface-raised"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <select
          value={selectedMonthId ?? ""}
          onChange={(e) => setSelectedMonthId(e.target.value)}
          className="h-11 w-full rounded-xl sm:h-auto sm:w-auto sm:rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
        >
          {months.map((m) => (
            <option key={m.id} value={m.id}>
              {monthOptionLabel(m, months)}
            </option>
          ))}
        </select>
      </div>

      {selectedMonth && messId && (
        <div>
          {activeTab === "month" && (
            <MonthSummaryView messId={messId} monthId={selectedMonth.id} />
          )}
          {activeTab === "meals" && (
            <MealsSummaryView messId={messId} monthId={selectedMonth.id} />
          )}
          {activeTab === "expenses" && (
            <ExpensesSummaryView messId={messId} monthId={selectedMonth.id} />
          )}
          {activeTab === "deposits" && (
            <DepositsSummaryView messId={messId} monthId={selectedMonth.id} />
          )}
          {activeTab === "members" && (
            <MembersSummaryView messId={messId} month={selectedMonth} />
          )}
        </div>
      )}
    </>
  );
}

function PageHeader() {
  const t = useTranslations("pages.reports");
  return (
    <div className="mb-8">
      <p className="label-mono text-primary">{t("reports")}</p>
      <h1 className="mt-2 heading-tight text-2xl text-foreground sm:text-3xl">
        {t("reports")}
      </h1>
    </div>
  );
}
