"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Landmark,
  Loader2,
  Plus,
  Receipt,
  ReceiptText,
  Scale,
  Sparkles,
} from "lucide-react";
import { QueriesErrorState, failedQueries } from "../feedback/QueryErrorState";
import { useGetMyMess } from "../../hooks/use-messes";
import { useGetActiveMonth, useCreateMonth } from "../../hooks/use-months";
import { useMessDashboard } from "../../hooks/use-members";
import { formatMoney } from "../../lib/format";
import { BentoCard, CardHeading } from "./bento";
import { Sheet, SheetActions } from "../ui/sheet";

type Tone = "success" | "destructive" | "neutral";

function FinanceRow({
  icon,
  label,
  value,
  tone = "neutral",
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: Tone;
  href?: string;
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : "text-foreground";

  const inner = (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 transition-colors hover:bg-surface-raised">
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-primary/10 p-2 text-primary">
          {icon}
        </span>
        <span className="text-sm font-medium text-foreground-muted">
          {label}
        </span>
      </div>
      <span className={`text-base font-bold tracking-tight ${toneClass}`}>
        {value}
      </span>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

export function MonthOverviewBento() {
  const t = useTranslations("dashboard.monthOverviewBento");
  const { data: myMess } = useGetMyMess();
  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";

  const monthQuery = useGetActiveMonth(messId);
  const dashboardQuery = useMessDashboard(messId);
  const { data: activeMonth, isLoading } = monthQuery;
  const { data: dashboard } = dashboardQuery;
  // If we can't tell whether a month is active, never offer t("startMonth"):
  // starting one closes the current month for good.
  const loadFailed = failedQueries(monthQuery, dashboardQuery).length > 0;
  const createMonth = useCreateMonth(messId);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const creating = createMonth.isPending;

  const generateTitle = () =>
    new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  const startMonth = (title: string) => {
    createMonth.mutate(
      { title: title.trim() || generateTitle() },
      { onSuccess: () => setConfirmOpen(false) },
    );
  };

  // Starting a month while one is active closes it for good, so ask first.
  const openConfirm = () => {
    createMonth.reset();
    setNewTitle(generateTitle());
    setConfirmOpen(true);
  };

  const startedDate = activeMonth?.started_at
    ? new Date(activeMonth.started_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const balance = dashboard?.total_balance ?? 0;
  const balanceTone: Tone =
    balance > 0 ? "success" : balance < 0 ? "destructive" : "neutral";
  const balanceSign = balance > 0 ? "+" : balance < 0 ? "−" : "";
  const balanceLabel =
    balance > 0 ? t("inSurplus") : balance < 0 ? t("amountDue") : t("settled");

  return (
    <BentoCard className="relative overflow-hidden p-6 md:p-7 lg:col-span-2 lg:row-span-2">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-primary/25 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] bg-primary/10 text-primary">
            <Sparkles size={11} />
            {t("currentMonth")}
          </span>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : activeMonth ? (
            <span className="rounded-[5px] border border-success/25 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] bg-success/10 text-success">
              {t("active")}
            </span>
          ) : null}
        </div>

        <div className="mt-5 flex-1">
          {loadFailed ? (
            <QueriesErrorState
              compact
              queries={[monthQuery, dashboardQuery]}
              resource="this month"
            />
          ) : isLoading ? (
            <div className="space-y-2">
              <div className="h-9 w-2/3 animate-pulse rounded-lg bg-surface-raised" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-surface-raised" />
            </div>
          ) : activeMonth ? (
            <>
              <div>
                <CardHeading
                  icon={<Scale size={15} />}
                  title={t("financialOverview")}
                />

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <FinanceRow
                    icon={<Landmark size={15} />}
                    label={t("totalDeposits")}
                    value={formatMoney(dashboard?.total_deposits ?? 0)}
                    href="/dashboard/deposits"
                  />
                  <FinanceRow
                    icon={<Receipt size={15} />}
                    label={t("totalExpenses")}
                    value={formatMoney(dashboard?.total_expenses ?? 0)}
                    href="/dashboard/expenses"
                  />
                  <FinanceRow
                    icon={<ReceiptText size={15} />}
                    label={t("totalBill")}
                    value={formatMoney(dashboard?.total_bill ?? 0)}
                  />
                  <div className="rounded-xl border border-success/15 bg-success/[0.06] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-mono font-medium uppercase tracking-[0.1em] text-foreground-muted">
                          {balance > 0 ? (
                            <ArrowDownLeft size={13} className="text-success" />
                          ) : balance < 0 ? (
                            <ArrowUpRight
                              size={13}
                              className="text-destructive"
                            />
                          ) : (
                            <Scale size={13} className="text-primary" />
                          )}
                          {t("currentBalance")}
                        </p>
                        <p
                          className={`mt-1 text-[11px] font-medium ${
                            balanceTone === "success"
                              ? "text-success"
                              : balanceTone === "destructive"
                                ? "text-destructive"
                                : "text-foreground-muted"
                          }`}
                        >
                          {balanceLabel}
                        </p>
                      </div>
                      <span
                        className={`text-2xl font-bold tracking-tight ${
                          balanceTone === "success"
                            ? "text-success"
                            : balanceTone === "destructive"
                              ? "text-destructive"
                              : "text-foreground"
                        }`}
                      >
                        {balanceSign}
                        {formatMoney(Math.abs(balance))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-5">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  {activeMonth.title}
                </h2>
                <p className="mt-1 text-sm text-foreground-muted">
                  {t("opened")} {startedDate}
                </p>
              </div>
            </>
          ) : (
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {t("noActiveMonth")}
              </h2>
              <p className="mt-2 max-w-sm text-sm text-foreground-muted">
                {t("startNewMonthBegin")}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5 border-t border-border pt-5">
          {isManager && !loadFailed && !isLoading ? (
            activeMonth ? (
              <>
                <button
                  type="button"
                  onClick={openConfirm}
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                >
                  <Plus size={15} />
                  {t("startNewMonth")}
                </button>
                <Link
                  href="/dashboard/months"
                  className="inline-flex items-center gap-1 rounded-xl border border-border-strong px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-raised"
                >
                  {t("viewMonth")}
                  <ChevronRight size={15} />
                </Link>
              </>
            ) : (
              <button
                type="button"
                onClick={() => startMonth(generateTitle())}
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {creating ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CalendarDays size={15} />
                )}
                {creating ? t("starting") : t("startMonth")}
              </button>
            )
          ) : null}
        </div>
      </div>

      {confirmOpen && activeMonth && (
        <Sheet
          onClose={() => setConfirmOpen(false)}
          title={t("startNewMonth2")}
          dismissible={!creating}
        >
          <p className="mb-4 text-sm text-foreground-muted">
            {t("closes")}{" "}
            <span className="font-semibold text-foreground">
              {activeMonth.title}
            </span>
            {t("itsBillsFinalizedBalances")}
          </p>

          <label
            htmlFor="new-month-title"
            className="mb-1.5 block text-xs font-semibold text-foreground-muted"
          >
            {t("newMonthName")}
          </label>
          <input
            id="new-month-title"
            type="text"
            value={newTitle}
            maxLength={100}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={creating}
            className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-base text-foreground sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
          />

          <SheetActions>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={creating}
              className="rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-60"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={() => startMonth(newTitle)}
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating && <Loader2 size={14} className="animate-spin" />}
              {creating ? t("closingMonth") : t("closeStartNew")}
            </button>
          </SheetActions>
        </Sheet>
      )}
    </BentoCard>
  );
}
