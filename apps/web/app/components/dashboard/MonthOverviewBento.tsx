"use client";

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
import { useGetMyMess } from "../../hooks/use-messes";
import { useGetActiveMonth, useCreateMonth } from "../../hooks/use-months";
import { useMessDashboard } from "../../hooks/use-members";
import { formatMoney } from "../../lib/format";
import { BentoCard, CardHeading } from "./bento";

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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-foreground-muted/10 bg-background/40 px-4 py-3 transition-colors hover:bg-surface-raised">
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
  const { data: myMess } = useGetMyMess();
  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";

  const { data: activeMonth, isLoading } = useGetActiveMonth(messId);
  const { data: dashboard } = useMessDashboard(messId);
  const createMonth = useCreateMonth(messId);

  const [creating, setCreating] = useState(false);

  const generateTitle = () =>
    new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  const handleCreateMonth = () => {
    setCreating(true);
    createMonth.mutate(
      { title: generateTitle() },
      {
        onSettled: () => setCreating(false),
      },
    );
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
    balance > 0 ? "In surplus" : balance < 0 ? "Amount due" : "Settled";

  return (
    <BentoCard className="relative overflow-hidden p-6 md:p-7 lg:col-span-2 lg:row-span-2">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            <Sparkles size={11} />
            Current month
          </span>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : activeMonth ? (
            <span className="rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
              Active
            </span>
          ) : null}
        </div>

        <div className="mt-5 flex-1">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-9 w-2/3 animate-pulse rounded-lg bg-foreground-muted/10" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-foreground-muted/10" />
            </div>
          ) : activeMonth ? (
            <>
              <div>
                <CardHeading
                  icon={<Scale size={15} />}
                  title="Financial overview"
                />

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <FinanceRow
                    icon={<Landmark size={15} />}
                    label="Total deposits"
                    value={formatMoney(dashboard?.total_deposits ?? 0)}
                    href="/dashboard/deposits"
                  />
                  <FinanceRow
                    icon={<Receipt size={15} />}
                    label="Total expenses"
                    value={formatMoney(dashboard?.total_expenses ?? 0)}
                    href="/dashboard/expenses"
                  />
                  <FinanceRow
                    icon={<ReceiptText size={15} />}
                    label="Total bill"
                    value={formatMoney(dashboard?.total_bill ?? 0)}
                  />
                  <div className="rounded-xl border border-success/15 bg-success/[0.06] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-foreground-muted">
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
                          Current balance
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

              <div className="mt-6 border-t border-foreground-muted/10 pt-5">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  {activeMonth.title}
                </h2>
                <p className="mt-1 text-sm text-foreground-muted">
                  Opened {startedDate}
                </p>
              </div>
            </>
          ) : (
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                No active month
              </h2>
              <p className="mt-2 max-w-sm text-sm text-foreground-muted">
                Start a new month to begin tracking meals, deposits, and
                expenses across your mess.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5 border-t border-foreground-muted/10 pt-5">
          {isManager ? (
            activeMonth ? (
              <>
                <button
                  type="button"
                  onClick={handleCreateMonth}
                  disabled={createMonth.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                >
                  {creating ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Plus size={15} />
                  )}
                  Start New Month
                </button>
                <Link
                  href="/dashboard/months"
                  className="inline-flex items-center gap-1 rounded-xl border border-foreground-muted/20 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-raised"
                >
                  View Month
                  <ChevronRight size={15} />
                </Link>
              </>
            ) : (
              <button
                type="button"
                onClick={handleCreateMonth}
                disabled={createMonth.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {creating ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CalendarDays size={15} />
                )}
                Start Month
              </button>
            )
          ) : null}
        </div>
      </div>
    </BentoCard>
  );
}
