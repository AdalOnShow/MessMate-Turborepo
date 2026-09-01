"use client";

import type { ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  ChefHat,
  Landmark,
  ReceiptText,
  Scale,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useGetMyMess } from "../../hooks/use-messes";
import { useMemberDashboard } from "../../hooks/use-members";
import { formatMoney } from "../../lib/format";
import { BentoCard, CardActionLink, CardHeading } from "./bento";

type Tone = "success" | "destructive" | "neutral";

function FinanceRow({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: Tone;
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : "text-foreground";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-foreground-muted/10 bg-background/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</span>
        <span className="text-sm font-medium text-foreground-muted">
          {label}
        </span>
      </div>
      <span className={`text-base font-bold tracking-tight ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

export function MemberMonthSummary() {
  const { data: myMess } = useGetMyMess();
  const messId = myMess?.id;
  const { data: member, isLoading } = useMemberDashboard(messId);

  const hasMonth = !!member?.month_id;
  const balance = member?.current_balance ?? 0;
  const balanceTone: Tone =
    balance > 0 ? "success" : balance < 0 ? "destructive" : "neutral";
  const balanceSign = balance > 0 ? "+" : balance < 0 ? "−" : "";
  const balanceLabel =
    balance > 0 ? "In surplus" : balance < 0 ? "Amount due" : "Settled";

  return (
    <BentoCard className="p-6 lg:col-span-2">
      <CardHeading
        icon={<UserRound size={15} />}
        title="Your month summary"
        action={
          <CardActionLink href="/dashboard/months">
            View Month <BarChart3 size={12} />
          </CardActionLink>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-20 animate-pulse rounded-xl bg-foreground-muted/10" />
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="h-16 animate-pulse rounded-xl bg-foreground-muted/10" />
            <div className="h-16 animate-pulse rounded-xl bg-foreground-muted/10" />
          </div>
        </div>
      ) : hasMonth ? (
        <>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              <Sparkles size={11} />
              {member?.month_title}
            </span>
            <span className="rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
              Active
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <FinanceRow
              icon={<Landmark size={15} />}
              label="My deposits"
              value={formatMoney(member?.deposit_amount ?? 0)}
            />
            <FinanceRow
              icon={<ReceiptText size={15} />}
              label="My bill"
              value={formatMoney(member?.final_bill ?? 0)}
            />
            <FinanceRow
              icon={<ChefHat size={15} />}
              label="Meal cost"
              value={formatMoney(member?.meal_cost ?? 0)}
            />
            <FinanceRow
              icon={<UserRound size={15} />}
              label="Shared cost"
              value={formatMoney(member?.shared_cost ?? 0)}
            />
            <FinanceRow
              icon={<UserRound size={15} />}
              label="Individual cost"
              value={formatMoney(member?.individual_cost ?? 0)}
            />
            <div className="rounded-xl border border-success/15 bg-success/[0.06] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-foreground-muted">
                    {balance > 0 ? (
                      <ArrowDownLeft size={13} className="text-success" />
                    ) : balance < 0 ? (
                      <ArrowUpRight size={13} className="text-destructive" />
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

          {member?.previous_balance ? (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-background/40 px-3.5 py-2">
              <span
                className={`text-sm font-bold ${
                  member.previous_balance > 0
                    ? "text-success"
                    : "text-destructive"
                }`}
              >
                {member.previous_balance > 0 ? "+" : "−"}
                {formatMoney(Math.abs(member.previous_balance))}
              </span>
              <span className="text-foreground-muted/40">·</span>
              <span className="text-[10px] uppercase tracking-wider text-foreground-muted">
                carried from previous month
              </span>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-foreground-muted/10 pt-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
                My meals
              </p>
              <p className="mt-0.5 text-lg font-bold text-foreground">
                {member?.total_meals ?? 0}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
                Meal rate
              </p>
              <p className="mt-0.5 text-lg font-bold text-foreground">
                {member?.meal_rate
                  ? formatMoney(Math.round(member.meal_rate))
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
                Meals report
              </p>
              <CardActionLink href="/dashboard/meals/reports">
                Open reports <BarChart3 size={12} />
              </CardActionLink>
            </div>
          </div>
        </>
      ) : (
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            No active month
          </h2>
          <p className="mt-2 max-w-sm text-sm text-foreground-muted">
            Once a month is started, your personal meals, deposits, expenses,
            and balance will show up here.
          </p>
        </div>
      )}
    </BentoCard>
  );
}