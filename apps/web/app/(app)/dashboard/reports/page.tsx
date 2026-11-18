"use client";

import { PageTips } from "../../../components/help/PageTips";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Loader2,
  Pencil,
  ReceiptText,
  ShoppingCart,
  Utensils,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useGetMyMess } from "../../../hooks/use-messes";
import { useGetActiveMonth } from "../../../hooks/use-months";
import { useGetMonthMealSummary } from "../../../hooks/use-meals";
import { useExpenseSummary } from "../../../hooks/use-expenses";
import {
  useBazaarHistory,
  useDepositHistory,
  useExpenseHistory,
  useMealDays,
} from "../../../hooks/use-reports";
import type { ExpenseInfo } from "../../../actions/expenses";
import { useDepositSummary } from "../../../hooks/use-deposits";
import { formatMoney } from "../../../lib/format";
import {
  FilterChips,
  LoadMore,
} from "../../../components/dashboard/reports/ListControls";
import {
  EditDepositSheet,
  EditExpenseSheet,
<<<<<<< HEAD:apps/web/app/(app)/dashboard/reports/page.tsx
} from "../../../components/dashboard/reports/EditEntrySheets";
=======
  EditMealDaySheet,
} from "../../components/dashboard/reports/EditEntrySheets";
>>>>>>> origin/main:apps/web/app/dashboard/reports/page.tsx
import type { DepositWithRelations, ExpenseWithRelations } from "@repo/shared";
import {
  QueriesErrorState,
  QueryErrorState,
  failedQueries,
} from "../../../components/feedback/QueryErrorState";

type Tab = "meals" | "expenses" | "deposits" | "bazaar";

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

function ActionsTh({ label }: { label: string }) {
  return (
    <th className="w-px whitespace-nowrap px-2 pb-2 pt-3 text-right text-xs font-semibold text-foreground-muted">
      <span className="sr-only">{label}</span>
    </th>
  );
}

function EditButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground"
    >
      <Pencil size={14} />
    </button>
  );
}

function MealsSummaryView({
  messId,
  monthId,
  isManager,
}: {
  messId: string;
  monthId: string;
  isManager: boolean;
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
      <MealList
        messId={messId}
        monthId={monthId}
        isManager={isManager}
        members={data.member_summaries
          .filter((m) => m.total_meals > 0)
          .map((m) => ({
            id: m.member_id,
            name: m.user.name,
            total: m.total_meals,
          }))
          .sort((a, b) => a.name.localeCompare(b.name))}
      />
    </div>
  );
}

function ExpensesSummaryView({
  messId,
  monthId,
  isManager,
}: {
  messId: string;
  monthId: string;
  isManager: boolean;
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
      <ExpenseList messId={messId} monthId={monthId} isManager={isManager} />
    </div>
  );
}

type ExpenseType = ExpenseInfo["type"];
type ExpenseFilter = "ALL" | ExpenseType;

const EXPENSE_TYPE_STYLES: Record<ExpenseType, string> = {
  SHARED: "border-primary/25 bg-primary/10 text-primary",
  INDIVIDUAL: "border-accent-warm/25 bg-accent-warm/10 text-accent-warm",
  BAZAAR: "border-success/25 bg-success/10 text-success",
};

/** "Nov 17" on top, "Mon" underneath. */
function DayDateCell({ iso }: { iso: string }) {
  const date = new Date(iso);
  return (
    <div className="whitespace-nowrap leading-tight">
      <p className="font-medium text-foreground">
        {date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        })}
      </p>
      <p className="mt-0.5 text-xs text-foreground-muted">
        {date.toLocaleDateString("en-US", {
          weekday: "short",
          timeZone: "UTC",
        })}
      </p>
    </div>
  );
}

/** Rows of every loaded page, in order. */
function flat<T, P>(pages: P[] | undefined, pick: (page: P) => T[]): T[] {
  return pages?.flatMap(pick) ?? [];
}

/** Every expense of the month, newest first, filterable by type, 8 per server page. */
function ExpenseList({
  messId,
  monthId,
  isManager,
}: {
  messId: string;
  monthId: string;
  isManager: boolean;
}) {
  const t = useTranslations("pages.reports");
  const [filter, setFilter] = useState<ExpenseFilter>("ALL");
  const [editing, setEditing] = useState<ExpenseWithRelations | null>(null);
  const query = useExpenseHistory(
    messId,
    monthId,
    filter === "ALL" ? undefined : filter,
  );

  const typeLabel = (type: ExpenseType) =>
    type === "SHARED"
      ? t("shared")
      : type === "INDIVIDUAL"
        ? t("individual")
        : t("bazaar");

  if (query.isPending) return <LoadingBlock />;
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

  const pages = query.data?.pages;
  const first = pages?.[0];
  const rows = flat(pages, (p) => p.items);
  const counts = first?.type_counts;

  return (
    <div className="space-y-3">
      <FilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { key: "ALL" as const, label: t("all"), count: counts?.ALL ?? 0 },
          ...(["SHARED", "INDIVIDUAL", "BAZAAR"] as const).map((type) => ({
            key: type,
            label: typeLabel(type),
            count: counts?.[type] ?? 0,
          })),
        ]}
      />

      {rows.length === 0 ? (
        <EmptyBlock message={t("noExpensesOfType")} />
      ) : (
        <div
          className={`overflow-x-auto rounded-xl border border-border bg-surface transition-opacity ${
            query.isPlaceholderData ? "opacity-60" : ""
          }`}
        >
          <table className="table-sticky-first w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <ThLeft label={t("date")} />
                <ThLeft label={t("name")} />
                <th className="hidden whitespace-nowrap px-4 pb-2 pt-3 text-left text-xs font-semibold text-foreground-muted md:table-cell">
                  {t("type")}
                </th>
                <Th label={t("amount")} />
                {isManager && <ActionsTh label={t("actions")} />}
              </tr>
            </thead>
            <tbody>
              {rows.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 align-top">
                    <DayDateCell iso={expense.expense_date} />
                  </td>
                  <td className="px-3 py-3 align-top md:px-4">
                    <p
                      title={expense.title}
                      className="max-w-[7.5rem] truncate font-medium text-foreground sm:max-w-[14rem] md:max-w-none md:whitespace-normal md:break-words"
                    >
                      {expense.title}
                    </p>
                    <div className="mt-1 md:hidden">
                      <span
                        className={`inline-block whitespace-nowrap rounded-[5px] border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${EXPENSE_TYPE_STYLES[expense.type]}`}
                      >
                        {typeLabel(expense.type)}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 align-top md:table-cell md:px-4">
                    <span
                      className={`inline-block whitespace-nowrap rounded-[5px] border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${EXPENSE_TYPE_STYLES[expense.type]}`}
                    >
                      {typeLabel(expense.type)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right align-top font-semibold tabular-nums text-foreground md:px-4">
                    {formatMoney(expense.amount)}
                  </td>
                  {isManager && (
                    <td className="px-2 py-2 text-right align-top">
                      {expense.type === "BAZAAR" ? (
                        <span
                          className="inline-block px-2 py-1.5 text-xs text-foreground-muted"
                          title={t("bazaarLockedHint")}
                        >
                          —
                        </span>
                      ) : (
                        <EditButton
                          label={t("edit")}
                          onClick={() => setEditing(expense)}
                        />
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditExpenseSheet
          messId={messId}
          monthId={monthId}
          expense={editing}
          onClose={() => setEditing(null)}
        />
      )}

      <LoadMore
        shown={rows.length}
        total={first?.total ?? rows.length}
        hasMore={!!query.hasNextPage}
        loading={query.isFetchingNextPage}
        onClick={() => void query.fetchNextPage()}
      />
    </div>
  );
}

/**
 * Meal grid: one row per day (newest first), one column per member, so the
 * list stays as long as the number of days. 8 days per server page; the
 * columns and month totals come from the month summary.
 */
function MealList({
  messId,
  monthId,
  isManager,
  members,
}: {
  messId: string;
  monthId: string;
  isManager: boolean;
  members: { id: string; name: string; total: number }[];
}) {
  const t = useTranslations("pages.reports");
  const query = useMealDays(messId, monthId);
  const [editingDay, setEditingDay] = useState<string | null>(null);

  if (query.isPending) return <LoadingBlock />;
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

  const pages = query.data?.pages;
  const days = flat(pages, (p) => p.days);
  if (days.length === 0) {
    return <EmptyBlock message={t("noMealEntriesRecorded")} />;
  }
  const grandTotal = members.reduce((sum, m) => sum + m.total, 0);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="table-sticky-first w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <ThLeft label={t("date")} />
              {members.map((m) => (
                <th
                  key={m.id}
                  title={m.name}
                  className="max-w-[6.5rem] truncate px-3 pb-2 pt-3 text-center text-xs font-semibold text-foreground-muted"
                >
                  {m.name.split(/\s+/)[0]}
                </th>
              ))}
              <Th label={t("total")} />
              {isManager && <ActionsTh label={t("actions")} />}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date} className="border-b border-border">
                <td className="px-4 py-2.5">
                  <DayDateCell iso={day.date} />
                </td>
                {members.map((m) => {
                  const count = day.by_member[m.id] ?? 0;
                  return (
                    <td
                      key={m.id}
                      className={`px-3 py-2.5 text-center tabular-nums ${
                        count > 0
                          ? "font-medium text-foreground"
                          : "text-foreground-muted/50"
                      }`}
                    >
                      {count > 0 ? count : "–"}
                    </td>
                  );
                })}
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-primary">
                  {day.total}
                </td>
                {isManager && (
                  <td className="px-2 py-2 text-right">
                    <EditButton
                      label={t("editMealDay")}
                      onClick={() => setEditingDay(day.date)}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border-strong">
              <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                {t("monthTotal")}
              </td>
              {members.map((m) => (
                <td
                  key={m.id}
                  className="px-3 py-3 text-center font-bold tabular-nums text-foreground"
                >
                  {m.total}
                </td>
              ))}
              <td className="px-4 py-3 text-right font-bold tabular-nums text-primary">
                {grandTotal}
              </td>
              {isManager && <td />}
            </tr>
          </tfoot>
        </table>
      </div>

      {editingDay && (
        <EditMealDaySheet
          messId={messId}
          monthId={monthId}
          dayIso={editingDay}
          onClose={() => setEditingDay(null)}
        />
      )}

      <LoadMore
        shown={days.length}
        total={pages?.[0]?.total_days ?? days.length}
        hasMore={!!query.hasNextPage}
        loading={query.isFetchingNextPage}
        onClick={() => void query.fetchNextPage()}
      />
    </div>
  );
}

function DepositsSummaryView({
  messId,
  monthId,
  isManager,
}: {
  messId: string;
  monthId: string;
  isManager: boolean;
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
      <DepositList messId={messId} monthId={monthId} isManager={isManager} />
    </div>
  );
}

/**
 * Every deposit of the month with its date, newest first, filterable by
 * member, 8 per server page: when each member paid and how much.
 */
function DepositList({
  messId,
  monthId,
  isManager,
}: {
  messId: string;
  monthId: string;
  isManager: boolean;
}) {
  const t = useTranslations("pages.reports");
  const [filter, setFilter] = useState<string>("ALL");
  const [editing, setEditing] = useState<DepositWithRelations | null>(null);
  const query = useDepositHistory(
    messId,
    monthId,
    filter === "ALL" ? undefined : filter,
  );

  if (query.isPending) return <LoadingBlock />;
  if (query.isError && !query.data) {
    return (
      <QueryErrorState
        compact
        error={query.error}
        onRetry={query.refetch}
        isRetrying={query.isFetching}
        resource="deposits"
      />
    );
  }

  const pages = query.data?.pages;
  const first = pages?.[0];
  const rows = flat(pages, (p) => p.items);
  const members = first?.member_counts ?? [];

  return (
    <div className="space-y-3">
      {members.length > 1 && (
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { key: "ALL", label: t("all"), count: first?.all_count ?? 0 },
            ...members.map((m) => ({
              key: m.member_id,
              label: m.name.split(/\s+/)[0] ?? m.name,
              count: m.count,
            })),
          ]}
        />
      )}

      {rows.length === 0 ? (
        <EmptyBlock message={t("noDepositsRecordedMonth")} />
      ) : (
        <div
          className={`overflow-x-auto rounded-xl border border-border bg-surface transition-opacity ${
            query.isPlaceholderData ? "opacity-60" : ""
          }`}
        >
          <table className="table-sticky-first w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <ThLeft label={t("date")} />
                <ThLeft label={t("member")} />
                <th className="hidden whitespace-nowrap px-4 pb-2 pt-3 text-left text-xs font-semibold text-foreground-muted md:table-cell">
                  {t("addedBy")}
                </th>
                <Th label={t("amount")} />
                {isManager && <ActionsTh label={t("actions")} />}
              </tr>
            </thead>
            <tbody>
              {rows.map((deposit) => (
                <tr
                  key={deposit.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 align-top">
                    <DayDateCell iso={deposit.deposit_date} />
                  </td>
                  <td className="px-3 py-3 align-top md:px-4">
                    {/* Capped on phones so a long name can't push the
                        amount off-screen. */}
                    <p
                      title={deposit.member.name}
                      className="max-w-[7.5rem] truncate font-medium text-foreground sm:max-w-[14rem] md:max-w-none"
                    >
                      {deposit.member.name}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 align-top text-foreground-muted md:table-cell">
                    {deposit.creator.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right align-top font-semibold tabular-nums text-success md:px-4">
                    +{formatMoney(deposit.amount)}
                  </td>
                  {isManager && (
                    <td className="px-2 py-2 text-right align-top">
                      <EditButton
                        label={t("edit")}
                        onClick={() => setEditing(deposit)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            {filter !== "ALL" && first && (
              <tfoot>
                <tr className="border-t-2 border-border-strong">
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted"
                  >
                    {t("monthTotal")}
                  </td>
                  <td className="hidden md:table-cell" />
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-primary md:px-4">
                    {formatMoney(first.total_amount)}
                  </td>
                  {isManager && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {editing && (
        <EditDepositSheet
          messId={messId}
          monthId={monthId}
          deposit={editing}
          onClose={() => setEditing(null)}
        />
      )}

      <LoadMore
        shown={rows.length}
        total={first?.total ?? rows.length}
        hasMore={!!query.hasNextPage}
        loading={query.isFetchingNextPage}
        onClick={() => void query.fetchNextPage()}
      />
    </div>
  );
}

type BazaarStatus = "APPROVED" | "PENDING" | "REJECTED";

/**
 * Bazaar purchases of the month: date, who bought it, what and how much.
 * Approved by default (what is billed); 8 per server page.
 */
function BazaarSummaryView({
  messId,
  monthId,
}: {
  messId: string;
  monthId: string;
}) {
  const t = useTranslations("pages.reports");
  const [status, setStatus] = useState<BazaarStatus>("APPROVED");
  const query = useBazaarHistory(messId, monthId, status);

  if (query.isPending) return <LoadingBlock />;
  if (query.isError && !query.data) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={query.refetch}
        isRetrying={query.isFetching}
        resource="bazaar"
      />
    );
  }

  const pages = query.data?.pages;
  const first = pages?.[0];
  const rows = flat(pages, (p) => p.items);
  const counts = first?.counts;
  const statusLabel = (s: BazaarStatus) =>
    s === "APPROVED"
      ? t("approved")
      : s === "PENDING"
        ? t("pending")
        : t("rejected");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={t("bazaarTotal", { status: statusLabel(status) })}
          value={formatMoney(first?.total_amount ?? 0)}
          highlight
        />
        <StatCard label={t("purchases")} value={String(first?.total ?? 0)} />
      </div>

      <FilterChips
        value={status}
        onChange={setStatus}
        options={(["APPROVED", "PENDING", "REJECTED"] as const).map((s) => ({
          key: s,
          label: statusLabel(s),
          count: counts?.[s.toLowerCase() as keyof typeof counts] ?? 0,
        }))}
      />

      {rows.length === 0 ? (
        <EmptyBlock message={t("noBazaarOfStatus")} />
      ) : (
        <div
          className={`overflow-x-auto rounded-xl border border-border bg-surface transition-opacity ${
            query.isPlaceholderData ? "opacity-60" : ""
          }`}
        >
          <table className="table-sticky-first w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <ThLeft label={t("date")} />
                <ThLeft label={t("purchasedBy")} />
                <Th label={t("amount")} />
              </tr>
            </thead>
            <tbody>
              {rows.map((bazaar) => {
                const items = bazaar.items.map((i) => i.name).join(", ");
                return (
                  <tr
                    key={bazaar.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 align-top">
                      <DayDateCell iso={bazaar.expense_date} />
                    </td>
                    <td className="px-3 py-3 align-top md:px-4">
                      <p
                        title={bazaar.submitter.name}
                        className="max-w-[7.5rem] truncate font-medium text-foreground sm:max-w-[14rem] md:max-w-none"
                      >
                        {bazaar.submitter.name}
                      </p>
                      <p
                        title={items}
                        className="mt-0.5 max-w-[7.5rem] truncate text-xs text-foreground-muted sm:max-w-[14rem] md:max-w-md"
                      >
                        {items}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right align-top font-semibold tabular-nums text-foreground md:px-4">
                      {formatMoney(bazaar.total_amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <LoadMore
        shown={rows.length}
        total={first?.total ?? rows.length}
        hasMore={!!query.hasNextPage}
        loading={query.isFetchingNextPage}
        onClick={() => void query.fetchNextPage()}
      />
    </div>
  );
}

export default function ReportsPage() {
  const t = useTranslations("pages.reports");
  const messQuery = useGetMyMess();
  const { data: myMess, isLoading: messLoading } = messQuery;
  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";
  const monthQuery = useGetActiveMonth(messId);
  const { data: activeMonth, isLoading: monthLoading } = monthQuery;
  const [activeTab, setActiveTab] = useState<Tab>("meals");

  const tabs: { key: Tab; label: string; icon: LucideIcon }[] = [
    { key: "meals", label: t("tabMeals"), icon: Utensils },
    { key: "expenses", label: t("tabExpenses"), icon: ReceiptText },
    { key: "deposits", label: t("tabDeposits"), icon: WalletCards },
    { key: "bazaar", label: t("tabBazaar"), icon: ShoppingCart },
  ];

  if (messLoading || monthLoading) return <LoadingBlock />;

  // Check failures before the "no active month" branch, or a network blip
  // would look like there is no month.
  if (failedQueries(messQuery, monthQuery).length > 0) {
    return (
      <>
        <PageHeader />
        <QueriesErrorState
          queries={[messQuery, monthQuery]}
          resource="reports"
        />
      </>
    );
  }

  if (!messId || !activeMonth) {
    return (
      <>
        <PageHeader />
        <EmptyBlock message={t("noActiveMonthStart")} />
      </>
    );
  }

  return (
    <>
      <PageHeader monthTitle={activeMonth.title} />

      <div className="no-scrollbar mb-6 flex snap-x gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
              className={`flex min-w-0 flex-1 snap-start flex-col items-center justify-center gap-1 whitespace-nowrap rounded-lg px-1 py-2 text-xs font-semibold transition-colors sm:flex-row sm:gap-2 sm:rounded-md sm:px-3 sm:text-sm ${
                activeTab === tab.key
                  ? "bg-primary text-white"
                  : "text-foreground-muted hover:bg-surface-raised"
              }`}
            >
              <Icon size={14} aria-hidden="true" />
              <span className="max-w-full truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "meals" && (
        <MealsSummaryView
          messId={messId}
          monthId={activeMonth.id}
          isManager={isManager}
        />
      )}
      {activeTab === "expenses" && (
        <ExpensesSummaryView
          messId={messId}
          monthId={activeMonth.id}
          isManager={isManager}
        />
      )}
      {activeTab === "deposits" && (
        <DepositsSummaryView
          messId={messId}
          monthId={activeMonth.id}
          isManager={isManager}
        />
      )}
      {activeTab === "bazaar" && (
        <BazaarSummaryView messId={messId} monthId={activeMonth.id} />
      )}
    </>
  );
}

function PageHeader({ monthTitle }: { monthTitle?: string | null }) {
  const t = useTranslations("pages.reports");
  return (
    <div className="mb-8">
      <p className="label-mono text-primary">{t("reports")}</p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <h1 className="heading-tight text-2xl text-foreground sm:text-3xl">
          {t("reports")}
        </h1>
        <PageTips page="reports" />
      </div>
      {monthTitle && (
        <p className="mt-1 text-sm text-foreground-muted">{monthTitle}</p>
      )}
    </div>
  );
}
