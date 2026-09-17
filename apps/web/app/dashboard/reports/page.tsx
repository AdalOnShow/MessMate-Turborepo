"use client";

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
    <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
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
    <div className="rounded-lg border border-foreground-muted/15 bg-surface p-3">
      <p className="text-xs font-medium text-foreground-muted">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${
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
      ? "text-green-500"
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

function UserCell({ name, email }: { name: string; email: string }) {
  return (
    <div>
      <p className="font-medium text-foreground">{name}</p>
      <p className="text-xs text-foreground-muted">{email}</p>
    </div>
  );
}

function Th({ label }: { label: string }) {
  return (
    <th className="pb-2 text-right text-xs font-semibold text-foreground-muted">
      {label}
    </th>
  );
}

function ThLeft({ label }: { label: string }) {
  return (
    <th className="pb-2 text-left text-xs font-semibold text-foreground-muted">
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
  const { data, isLoading } = useGetMonthSummary(messId, monthId);

  if (isLoading) return <LoadingBlock />;

  if (!data || data.member_summaries.length === 0) {
    return (
      <EmptyBlock message="No summary data available for this month yet. Close the month from the dashboard to generate member summaries." />
    );
  }

  return (
    <div className="space-y-4">
      <StatCard label="Members" value={String(data.member_summaries.length)} />
      <div className="overflow-x-auto rounded-xl border border-foreground-muted/15 bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground-muted/10">
              <ThLeft label="Member" />
              <Th label="Meals" />
              <Th label="Meal Cost" />
              <Th label="Shared" />
              <Th label="Individual" />
              <Th label="Bill" />
              <Th label="Deposit" />
              <Th label="Balance" />
            </tr>
          </thead>
          <tbody>
            {data.member_summaries.map((s) => (
              <tr
                key={s.id}
                className="border-b border-foreground-muted/5 last:border-0"
              >
                <td className="py-3">
                  <UserCell name={s.user.name} email={s.user.email} />
                </td>
                <td className="py-3 text-right text-foreground">
                  {s.total_meals}
                </td>
                <td className="py-3 text-right text-foreground">
                  {formatMoney(s.meal_cost)}
                </td>
                <td className="py-3 text-right text-foreground">
                  {formatMoney(s.shared_cost)}
                </td>
                <td className="py-3 text-right text-foreground">
                  {formatMoney(s.individual_cost)}
                </td>
                <td className="py-3 text-right font-semibold text-foreground">
                  {formatMoney(s.final_bill)}
                </td>
                <td className="py-3 text-right text-foreground">
                  {formatMoney(s.deposit_amount)}
                </td>
                <td className="py-3 text-right">
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
  const { data, isLoading } = useGetMonthMealSummary(messId, monthId);

  if (isLoading) return <LoadingBlock />;

  if (!data || data.member_summaries.length === 0) {
    return (
      <EmptyBlock message="No meal entries recorded for this month yet." />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Meals" value={String(data.total_meals)} />
        <StatCard label="Active Days" value={String(data.active_days)} />
        <StatCard label="Entries" value={String(data.total_entries)} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-foreground-muted/15 bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground-muted/10">
              <ThLeft label="Member" />
              <Th label="Meals" />
              <Th label="Entries" />
            </tr>
          </thead>
          <tbody>
            {data.member_summaries.map((s) => (
              <tr
                key={s.member_id}
                className="border-b border-foreground-muted/5 last:border-0"
              >
                <td className="py-3">
                  <UserCell name={s.user.name} email={s.user.email} />
                </td>
                <td className="py-3 text-right font-semibold text-foreground">
                  {s.total_meals}
                </td>
                <td className="py-3 text-right text-foreground">
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
  const { data, isLoading } = useExpenseSummary(messId, monthId);

  if (isLoading) return <LoadingBlock />;

  if (!data || data.count === 0) {
    return <EmptyBlock message="No expenses recorded for this month yet." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Total" value={formatMoney(data.total)} highlight />
        <StatCard label="Shared" value={formatMoney(data.shared_total)} />
        <StatCard
          label="Individual"
          value={formatMoney(data.individual_total)}
        />
        <StatCard label="Bazaar" value={formatMoney(data.bazaar_total)} />
        <StatCard label="Count" value={String(data.count)} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-foreground-muted/15 bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground-muted/10">
              <ThLeft label="Member" />
              <Th label="Shared Cost" />
              <Th label="Individual" />
              <Th label="Total" />
            </tr>
          </thead>
          <tbody>
            {data.per_member.map((m) => (
              <tr
                key={m.member_id}
                className="border-b border-foreground-muted/5 last:border-0"
              >
                <td className="py-3">
                  <UserCell name={m.user.name} email={m.user.email} />
                </td>
                <td className="py-3 text-right text-foreground">
                  {formatMoney(m.shared_cost)}
                </td>
                <td className="py-3 text-right text-foreground">
                  {formatMoney(m.individual_cost)}
                </td>
                <td className="py-3 text-right font-semibold text-foreground">
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
  const { data, isLoading } = useDepositSummary(messId, monthId);

  if (isLoading) return <LoadingBlock />;

  if (!data || data.count === 0) {
    return <EmptyBlock message="No deposits recorded for this month yet." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Deposits"
          value={formatMoney(data.total)}
          highlight
        />
        <StatCard label="Transactions" value={String(data.count)} />
        <StatCard label="Depositors" value={String(data.per_member.length)} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-foreground-muted/15 bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground-muted/10">
              <ThLeft label="Member" />
              <Th label="Count" />
              <Th label="Amount" />
            </tr>
          </thead>
          <tbody>
            {data.per_member.map((m) => (
              <tr
                key={m.member_id}
                className="border-b border-foreground-muted/5 last:border-0"
              >
                <td className="py-3">
                  <UserCell name={m.user.name} email={m.user.email} />
                </td>
                <td className="py-3 text-right text-foreground">{m.count}</td>
                <td className="py-3 text-right font-semibold text-foreground">
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
  const isActive = month.month_status === "ACTIVE";
  const { data: calc, isLoading: calcLoading } = useMemberCalculations(messId);
  const { data: summary, isLoading: summaryLoading } = useGetMonthSummary(
    messId,
    isActive ? undefined : month.id,
  );

  if (isActive ? calcLoading : summaryLoading) return <LoadingBlock />;

  const rows: MemberRow[] = isActive
    ? (calc?.items ?? [])
    : (summary?.member_summaries ?? []);

  if (rows.length === 0) {
    return (
      <EmptyBlock
        message={
          isActive
            ? "No member data available yet. Record meals and expenses for this month."
            : "No summary available for this month yet."
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-muted">
        {isActive
          ? "Live calculations for the current active month."
          : "Calculations from the archived month summary."}
      </p>
      <div className="overflow-x-auto rounded-xl border border-foreground-muted/15 bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground-muted/10">
              <ThLeft label="Member" />
              <Th label="Meals" />
              <Th label="Meal Cost" />
              <Th label="Shared" />
              <Th label="Individual" />
              <Th label="Deposit" />
              <Th label="Bill" />
              <Th label="Balance" />
              {isActive && <Th label="Carried" />}
              {isActive && <Th label="Current" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.member_id}
                className="border-b border-foreground-muted/5 last:border-0"
              >
                <td className="py-3">
                  <UserCell name={row.user.name} email={row.user.email} />
                </td>
                <td className="py-3 text-right text-foreground">
                  {row.total_meals}
                </td>
                <td className="py-3 text-right text-foreground">
                  {formatMoney(row.meal_cost)}
                </td>
                <td className="py-3 text-right text-foreground">
                  {formatMoney(row.shared_cost)}
                </td>
                <td className="py-3 text-right text-foreground">
                  {formatMoney(row.individual_cost)}
                </td>
                <td className="py-3 text-right text-foreground">
                  {formatMoney(row.deposit_amount)}
                </td>
                <td className="py-3 text-right font-semibold text-foreground">
                  {formatMoney(row.final_bill)}
                </td>
                <td className="py-3 text-right">
                  <BalanceBadge value={row.final_balance} />
                </td>
                {isActive && (
                  <td className="py-3 text-right">
                    <BalanceBadge value={row.previous_balance ?? 0} />
                  </td>
                )}
                {isActive && (
                  <td className="py-3 text-right">
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
  const { data: myMess, isLoading: messLoading } = useGetMyMess();
  const messId = myMess?.id;
  const { data: activeMonth } = useGetActiveMonth(messId);
  const { data: months, isLoading: monthsLoading } = useGetMonthHistory(messId);

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
    { key: "month", label: "Month Summary", icon: BarChart3 },
    { key: "meals", label: "Meals", icon: Utensils },
    { key: "expenses", label: "Expenses", icon: ReceiptText },
    { key: "deposits", label: "Deposits", icon: WalletCards },
    { key: "members", label: "Members", icon: User },
  ];

  if (messLoading || monthsLoading) return <LoadingBlock />;

  if (!months || months.length === 0) {
    return (
      <>
        <PageHeader />
        <EmptyBlock message="No months found. Start a new month from the dashboard to view reports." />
      </>
    );
  }

  return (
    <>
      <PageHeader />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 gap-1 overflow-x-auto rounded-lg border border-foreground-muted/15 bg-surface p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
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
          className="rounded-lg border border-foreground-muted/20 bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          {months.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
              {m.month_status === "ACTIVE" ? " (Active)" : ""}
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
  return (
    <div className="mb-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">
        Reports
      </p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">Reports</h1>
    </div>
  );
}
