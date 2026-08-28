"use client";

import type { ReactNode } from "react";
import type {
  MemberCalculationListInfo,
  MemberData,
} from "../../../hooks/use-members";
import {
  ChefHat,
  WalletCards,
  Utensils,
  Users,
  UserRound,
  ReceiptText,
  Crown,
  UserCog,
  UserMinus,
} from "lucide-react";

const moneyFmt = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function formatMoney(n: number) {
  return `৳${moneyFmt.format(n)}`;
}

function formatCompact(n: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(n);
}

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "User";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

type Tone = "surplus" | "due" | "even";

function Stat({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`group/stat flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors duration-200 ${
        highlight
          ? "border-primary/25 bg-primary/5"
          : "border-foreground-muted/10 bg-surface-raised/60 hover:border-foreground-muted/20"
      }`}
    >
      <span
        className={`shrink-0 ${
          highlight ? "text-primary" : "text-foreground-muted"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          {label}
        </p>
        <p
          className={`truncate text-sm font-semibold ${
            highlight ? "text-primary" : "text-foreground"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function BalanceChip({
  label,
  value,
  positive,
}: {
  label: string;
  value: number;
  positive: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
        {label}
      </span>
      <span
        className={`text-sm font-bold ${
          positive
            ? "text-success"
            : value !== 0
              ? "text-destructive"
              : "text-foreground-muted"
        }`}
      >
        {value > 0 ? "+" : value < 0 ? "−" : ""}
        {formatMoney(Math.abs(value))}
      </span>
    </div>
  );
}

export function MemberCards({
  data,
  isManager,
  currentUserId,
  onRoleClick,
  onRemoveClick,
}: {
  data: MemberCalculationListInfo | null | undefined;
  isManager: boolean;
  currentUserId?: string;
  onRoleClick: (member: MemberData) => void;
  onRemoveClick: (member: MemberData) => void;
}) {
  const items = data?.items ?? [];

  const toMemberData = (
    m: MemberCalculationListInfo["items"][number],
  ): MemberData => ({
    id: m.member_id,
    mess_id: "",
    user_id: m.user_id,
    mess_role: m.mess_role,
    joined_at: "",
    removed_at: m.removed_at,
    user: m.user,
  });

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-foreground-muted/15 bg-surface p-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Users size={22} className="text-primary" />
        </div>
        <p className="text-lg font-semibold text-foreground">
          No active members
        </p>
        <p className="mt-1 text-sm text-foreground-muted">
          Add members to see their live calculation summary.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {data?.month_id && (
        <div className="rounded-2xl border border-foreground-muted/10 bg-surface px-4 py-3 sm:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <CalendarIcon size={16} />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                Active month
              </p>
              <p className="text-sm font-semibold text-foreground">
                {data.month_title}
              </p>
            </div>
          </div>
        </div>
      )}

      {items.map((m, idx) => {
        const balance = m.current_balance;
        const tone: Tone =
          balance > 0 ? "surplus" : balance < 0 ? "due" : "even";
        return (
          <div
            key={m.member_id}
            className="group rounded-2xl border border-foreground-muted/15 bg-surface shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground-muted/25 hover:shadow-lg"
            style={{
              animation: `fade-in-up 400ms var(--ease-spring) ${idx * 40}ms both`,
            }}
          >
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="relative shrink-0">
                    {m.user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.user.avatar}
                        alt=""
                        className="h-12 w-12 rounded-2xl object-cover ring-2 ring-foreground-muted/10"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-sm font-bold text-primary ring-1 ring-primary/20">
                        {initials(m.user.name, m.user.email)}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface ${
                        m.removed_at ? "bg-foreground-muted/50" : "bg-success"
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-semibold text-foreground">
                        {m.user.name}
                      </p>
                      {m.mess_role === "MANAGER" && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-warm/15 px-2 py-0.5 text-[10px] font-semibold text-accent-warm">
                          <Crown size={9} strokeWidth={2.5} />
                          Manager
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-foreground-muted">
                      {m.user.email}
                    </p>
                  </div>
                </div>

                {isManager && !m.removed_at && m.user_id !== currentUserId && (
                  <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => onRoleClick(toMemberData(m))}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-foreground-muted/20 px-3 py-1.5 text-xs font-semibold text-foreground-muted opacity-0 transition-all duration-200 hover:border-foreground-muted/40 hover:bg-surface-raised hover:text-foreground group-hover:opacity-100"
                    >
                      <UserCog size={14} />
                      Role
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveClick(toMemberData(m))}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/25 px-3 py-1.5 text-xs font-semibold text-destructive opacity-0 transition-all duration-200 hover:bg-destructive/10 group-hover:opacity-100"
                    >
                      <UserMinus size={14} />
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Net balance strip */}
              <div
                className={`mt-4 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${
                  tone === "surplus"
                    ? "border-success/15 bg-success/[0.06]"
                    : tone === "due"
                      ? "border-destructive/15 bg-destructive/[0.06]"
                      : "border-primary/15 bg-primary/[0.06]"
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                    Current balance
                  </span>
                  <span
                    className={`mt-0.5 text-2xl font-bold tracking-tight ${
                      tone === "surplus"
                        ? "text-success"
                        : tone === "due"
                          ? "text-destructive"
                          : "text-foreground"
                    }`}
                  >
                    {balance > 0 ? "+" : balance < 0 ? "−" : ""}
                    {formatMoney(Math.abs(balance))}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    tone === "surplus"
                      ? "bg-success/15 text-success"
                      : tone === "due"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-primary/15 text-primary"
                  }`}
                >
                  {tone === "surplus"
                    ? "In surplus"
                    : tone === "due"
                      ? "Owes money"
                      : "Settled"}
                </span>
              </div>

              {/* Stats grid */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Stat
                  icon={<ChefHat size={15} />}
                  label="Meals"
                  value={`${formatCompact(m.total_meals)}`}
                />
                <Stat
                  icon={<WalletCards size={15} />}
                  label="Deposits"
                  value={formatMoney(m.deposit_amount)}
                  highlight
                />
                <Stat
                  icon={<Utensils size={15} />}
                  label="Meal cost"
                  value={formatMoney(m.meal_cost)}
                />
                <Stat
                  icon={<Users size={15} />}
                  label="Shared"
                  value={formatMoney(m.shared_cost)}
                />
                <Stat
                  icon={<UserRound size={15} />}
                  label="Individual"
                  value={formatMoney(m.individual_cost)}
                />
                <Stat
                  icon={<ReceiptText size={15} />}
                  label="Total bill"
                  value={formatMoney(m.final_bill)}
                />
              </div>

              {/* Carried balance */}
              {m.previous_balance !== 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-background/40 px-3.5 py-2">
                  <BalanceChip
                    label="Carried"
                    value={m.previous_balance}
                    positive={m.previous_balance >= 0}
                  />
                  <span className="text-foreground-muted/40">·</span>
                  <span className="text-[10px] uppercase tracking-wider text-foreground-muted">
                    from previous month
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CalendarIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
