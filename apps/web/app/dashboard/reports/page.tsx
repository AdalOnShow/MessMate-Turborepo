"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
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
import {
  useGetMealEntries,
  useGetMonthMealSummary,
} from "../../hooks/use-meals";
import { useExpenseSummary, useGetExpenses } from "../../hooks/use-expenses";
import type { ExpenseInfo } from "../../actions/expenses";
import { useDepositSummary } from "../../hooks/use-deposits";
import { useMemberCalculations } from "../../hooks/use-members";
import { formatMoney } from "../../lib/format";
import { Button } from "../../components/ui/button";
import {
  QueriesErrorState,
  QueryErrorState,
  failedQueries,
} from "../../components/feedback/QueryErrorState";

type Tab = "meals" | "expenses" | "deposits" | "members";

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
      <MealList messId={messId} monthId={monthId} />
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
      </div>
      <ExpenseList messId={messId} monthId={monthId} />
    </div>
  );
}

const PAGE_SIZE = 10;

type ExpenseType = ExpenseInfo["type"];
type ExpenseFilter = "ALL" | ExpenseType;

const EXPENSE_TYPE_STYLES: Record<ExpenseType, string> = {
  SHARED: "border-primary/25 bg-primary/10 text-primary",
  INDIVIDUAL: "border-accent-warm/25 bg-accent-warm/10 text-accent-warm",
  BAZAAR: "border-success/25 bg-success/10 text-success",
};

function byNewest(
  a: { date: string; created_at: string },
  b: { date: string; created_at: string },
) {
  return (
    new Date(b.date).getTime() - new Date(a.date).getTime() ||
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/** "Nov 17" on top, "Mon" underneath. */
function DayDateCell({ iso }: { iso: string }) {
  const date = new Date(iso);
  return (
    <div className="whitespace-nowrap leading-tight">
      <p className="font-medium text-foreground">
        {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </p>
      <p className="mt-0.5 text-xs text-foreground-muted">
        {date.toLocaleDateString("en-US", { weekday: "short" })}
      </p>
    </div>
  );
}

function FilterChips<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string; count: number }[];
  value: K;
  onChange: (key: K) => void;
}) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
      {options.map((option) => {
        const selected = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface text-foreground-muted hover:border-border-strong hover:text-foreground"
            }`}
          >
            {option.label}
            <span className="tabular-nums opacity-70">{option.count}</span>
          </button>
        );
      })}
    </div>
  );
}

function LoadMore({
  shown,
  total,
  onClick,
}: {
  shown: number;
  total: number;
  onClick: () => void;
}) {
  const t = useTranslations("pages.reports");
  if (shown >= total) return null;
  return (
    <div className="flex flex-col items-center gap-2 pt-1">
      <p className="text-xs text-foreground-muted">
        {t("showingOf", { shown, total })}
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        className="w-full sm:w-auto"
      >
        <ChevronDown />
        {t("loadMore")}
      </Button>
    </div>
  );
}

/** Every expense of the month, newest first, filterable by type and revealed 10 at a time. */
function ExpenseList({ messId, monthId }: { messId: string; monthId: string }) {
  const t = useTranslations("pages.reports");
  const query = useGetExpenses(messId, monthId);
  const [filter, setFilter] = useState<ExpenseFilter>("ALL");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const typeLabel = (type: ExpenseType) =>
    type === "SHARED"
      ? t("shared")
      : type === "INDIVIDUAL"
        ? t("individual")
        : t("bazaar");

  const sorted = useMemo(
    () =>
      [...(query.data?.items ?? [])].sort((a, b) =>
        byNewest(
          { date: a.expense_date, created_at: a.created_at },
          { date: b.expense_date, created_at: b.created_at },
        ),
      ),
    [query.data],
  );

  if (query.isLoading) return <LoadingBlock />;
  if (query.isError && !query.data) {
    return (
      <QueryErrorState
        compact
        error={query.error}
        onRetry={query.refetch}
        isRetrying={query.isFetching}
        resource="expenses"
      />
    );
  }

  const filtered =
    filter === "ALL" ? sorted : sorted.filter((e) => e.type === filter);
  const shown = filtered.slice(0, visible);

  return (
    <div className="space-y-3">
      <FilterChips
        value={filter}
        onChange={(key) => {
          setFilter(key);
          setVisible(PAGE_SIZE);
        }}
        options={[
          { key: "ALL" as const, label: t("all"), count: sorted.length },
          ...(["SHARED", "INDIVIDUAL", "BAZAAR"] as const).map((type) => ({
            key: type,
            label: typeLabel(type),
            count: sorted.filter((e) => e.type === type).length,
          })),
        ]}
      />

      {shown.length === 0 ? (
        <EmptyBlock message={t("noExpensesOfType")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="table-sticky-first w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <ThLeft label={t("date")} />
                <ThLeft label={t("name")} />
                <ThLeft label={t("type")} />
                <Th label={t("amount")} />
              </tr>
            </thead>
            <tbody>
              {shown.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 align-top">
                    <DayDateCell iso={expense.expense_date} />
                  </td>
                  <td className="min-w-[9rem] px-4 py-3 align-top font-medium break-words text-foreground">
                    {expense.title}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`inline-block whitespace-nowrap rounded-[5px] border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${EXPENSE_TYPE_STYLES[expense.type]}`}
                    >
                      {typeLabel(expense.type)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right align-top font-semibold tabular-nums text-foreground">
                    {formatMoney(expense.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LoadMore
        shown={shown.length}
        total={filtered.length}
        onClick={() => setVisible((v) => v + PAGE_SIZE)}
      />
    </div>
  );
}

// The entries endpoint requires a date range; the month id already scopes it.
const ALL_DATES = { start: "2000-01-01", end: "2999-12-31" };

/** Day-by-day meal counts per member, newest day first, revealed 10 rows at a time. */
function MealList({ messId, monthId }: { messId: string; monthId: string }) {
  const t = useTranslations("pages.reports");
  const query = useGetMealEntries(
    messId,
    monthId,
    ALL_DATES.start,
    ALL_DATES.end,
  );
  const [member, setMember] = useState<string>("ALL");
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Days where a member ate nothing are left out to keep the list readable.
  const sorted = useMemo(
    () =>
      (query.data ?? [])
        .filter((entry) => entry.total_meal > 0)
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime() ||
            a.member.user.name.localeCompare(b.member.user.name),
        ),
    [query.data],
  );

  const members = useMemo(() => {
    const totals = new Map<string, { name: string; meals: number }>();
    for (const entry of sorted) {
      const current = totals.get(entry.member_id);
      totals.set(entry.member_id, {
        name: entry.member.user.name,
        meals: (current?.meals ?? 0) + entry.total_meal,
      });
    }
    return [...totals.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sorted]);

  if (query.isLoading) return <LoadingBlock />;
  if (query.isError && !query.data) {
    return (
      <QueryErrorState
        compact
        error={query.error}
        onRetry={query.refetch}
        isRetrying={query.isFetching}
        resource="meal entries"
      />
    );
  }

  const filtered =
    member === "ALL" ? sorted : sorted.filter((e) => e.member_id === member);
  const shown = filtered.slice(0, visible);
  const allMeals = sorted.reduce((sum, e) => sum + e.total_meal, 0);

  return (
    <div className="space-y-3">
      <FilterChips
        value={member}
        onChange={(key) => {
          setMember(key);
          setVisible(PAGE_SIZE);
        }}
        options={[
          { key: "ALL", label: t("all"), count: allMeals },
          ...members.map((m) => ({ key: m.id, label: m.name, count: m.meals })),
        ]}
      />

      {shown.length === 0 ? (
        <EmptyBlock message={t("noMealEntriesRecorded")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="table-sticky-first w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <ThLeft label={t("date")} />
                <ThLeft label={t("name")} />
                <Th label={t("meals")} />
              </tr>
            </thead>
            <tbody>
              {shown.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 align-top">
                    <DayDateCell iso={entry.date} />
                  </td>
                  <td className="min-w-[9rem] px-4 py-3 align-top font-medium break-words text-foreground">
                    {entry.member.user.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right align-top font-semibold tabular-nums text-foreground">
                    {entry.total_meal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LoadMore
        shown={shown.length}
        total={filtered.length}
        onClick={() => setVisible((v) => v + PAGE_SIZE)}
      />
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
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={t("totalDeposits")}
          value={formatMoney(data.total)}
          highlight
        />
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
  const [activeTab, setActiveTab] = useState<Tab>("meals");

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
          {activeTab === "meals" && (
            <MealsSummaryView
              key={selectedMonth.id}
              messId={messId}
              monthId={selectedMonth.id}
            />
          )}
          {activeTab === "expenses" && (
            <ExpensesSummaryView
              key={selectedMonth.id}
              messId={messId}
              monthId={selectedMonth.id}
            />
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
