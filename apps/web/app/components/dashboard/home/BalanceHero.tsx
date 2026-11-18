"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  ReceiptText,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import type {
  useMemberDashboard,
  useMessDashboard,
} from "@/app/hooks/use-members";
import { formatMoney } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";
import { QueryErrorState } from "../../feedback/QueryErrorState";
import { Skeleton } from "../../ui/skeleton";
import { balanceTone, type Tone } from "./shared";

type Stat = { label: string; value: string; icon: LucideIcon; href?: string };

type Progress = { label: string; percent: number };

const toneBar: Record<Tone, string> = {
  success: "bg-success",
  destructive: "bg-destructive",
  neutral: "bg-primary",
};

const toneSign: Record<Tone, string> = {
  success: "text-success",
  destructive: "text-destructive",
  neutral: "text-foreground",
};

function HeroShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
      {children}
    </section>
  );
}

function HeroSkeleton() {
  return (
    <HeroShell>
      <Skeleton className="h-3.5 w-24 rounded" />
      <Skeleton className="mt-3 h-11 w-48" />
      <Skeleton className="mt-5 h-1.5 w-full rounded-full" />
      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[68px] rounded-2xl" />
        ))}
      </div>
    </HeroShell>
  );
}

function StatTile({ stat }: { stat: Stat }) {
  const Icon = stat.icon;
  const content = (
    <>
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground-muted">
        <Icon size={13} aria-hidden="true" className="shrink-0" />
        <span className="truncate">{stat.label}</span>
      </span>
      <span className="mt-1 block truncate text-base font-bold text-foreground tabular-nums sm:text-lg">
        {stat.value}
      </span>
      {stat.href ? (
        <ChevronRight
          size={14}
          aria-hidden="true"
          className="absolute right-2.5 top-3 text-foreground-muted opacity-0 transition-opacity group-hover:opacity-100"
        />
      ) : null}
    </>
  );
  const base =
    "relative min-w-0 rounded-2xl border border-border bg-surface-raised/70 px-3 py-2.5";

  return stat.href ? (
    <Link
      href={stat.href}
      className={cn(
        base,
        "group transition-colors hover:border-border-strong hover:bg-surface-raised",
      )}
    >
      {content}
    </Link>
  ) : (
    <div className={base}>{content}</div>
  );
}

function BalanceBody({
  label,
  balance,
  note,
  progress,
  stats,
}: {
  label: string;
  balance: number;
  note?: string;
  progress?: Progress;
  stats: Stat[];
}) {
  const t = useTranslations("dashboard.home");
  const tone = balanceTone(balance);
  const status =
    tone === "success"
      ? { text: t("inSurplus"), icon: <ArrowDownLeft size={12} /> }
      : tone === "destructive"
        ? { text: t("amountDue"), icon: <ArrowUpRight size={12} /> }
        : { text: t("settled"), icon: <Check size={12} /> };

  return (
    <HeroShell>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground-muted">{label}</p>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            tone === "success" &&
              "border-success/20 bg-success/10 text-success",
            tone === "destructive" &&
              "border-destructive/20 bg-destructive/10 text-destructive",
            tone === "neutral" &&
              "border-border bg-surface-raised text-foreground-muted",
          )}
        >
          {status.icon}
          {status.text}
        </span>
      </div>

      <p className="mt-2 text-4xl font-extrabold tracking-[-0.03em] text-foreground tabular-nums sm:text-5xl">
        {balance !== 0 ? (
          <span className={cn("mr-0.5", toneSign[tone])}>
            {balance < 0 ? "−" : "+"}
          </span>
        ) : null}
        {formatMoney(Math.abs(balance))}
      </p>
      {note ? (
        <p className="mt-1.5 text-xs text-foreground-muted">{note}</p>
      ) : null}

      {progress ? (
        <div className="mt-5">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percent}
            aria-label={progress.label}
            className="h-1.5 overflow-hidden rounded-full bg-surface-overlay"
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                toneBar[tone],
              )}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-foreground-muted">{progress.label}</p>
        </div>
      ) : null}

      <div
        className={cn(
          "mt-5 grid gap-2.5",
          stats.length === 2 ? "grid-cols-2" : "grid-cols-3",
        )}
      >
        {stats.map((stat) => (
          <StatTile key={stat.label} stat={stat} />
        ))}
      </div>
    </HeroShell>
  );
}

/** Share of `part` in `whole`, clamped to 0–100. Undefined when `whole` is 0. */
function percentOf(part: number, whole: number) {
  if (whole <= 0) return undefined;
  return Math.min(100, Math.max(0, Math.round((part / whole) * 100)));
}

/** Manager hero: the whole mess's balance for the active month. */
export function MessBalanceHero({
  query,
}: {
  query: ReturnType<typeof useMessDashboard>;
}) {
  const t = useTranslations("dashboard.home");
  const data = query.data;

  if (query.isPending) return <HeroSkeleton />;
  if (!data) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={query.refetch}
        isRetrying={query.isFetching}
        resource="this month"
      />
    );
  }

  const spent = percentOf(data.total_expenses, data.total_deposits);
  return (
    <BalanceBody
      label={t("messBalance")}
      balance={data.total_balance}
      progress={
        spent === undefined
          ? undefined
          : { percent: spent, label: t("depositsSpent", { percent: spent }) }
      }
      stats={[
        {
          label: t("deposits"),
          value: formatMoney(data.total_deposits),
          icon: WalletCards,
          href: "/dashboard/deposits",
        },
        {
          label: t("expenses"),
          value: formatMoney(data.total_expenses),
          icon: ReceiptText,
          href: "/dashboard/expenses",
        },
        {
          label: t("members"),
          value: String(data.total_members),
          icon: Users,
          href: "/dashboard/members",
        },
      ]}
    />
  );
}

/** Member hero: the signed-in member's own balance. */
export function MyBalanceHero({
  query,
}: {
  query: ReturnType<typeof useMemberDashboard>;
}) {
  const t = useTranslations("dashboard.home");
  const data = query.data;

  if (query.isPending) return <HeroSkeleton />;
  if (!data) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={query.refetch}
        isRetrying={query.isFetching}
        resource="your summary"
      />
    );
  }

  const carried = data.previous_balance;
  const covered = percentOf(data.deposit_amount, data.final_bill);
  return (
    <BalanceBody
      label={t("myBalance")}
      balance={data.current_balance}
      note={
        carried
          ? t("carried", {
              amount: `${carried < 0 ? "−" : "+"}${formatMoney(Math.abs(carried))}`,
            })
          : undefined
      }
      progress={
        covered === undefined
          ? undefined
          : { percent: covered, label: t("billCovered", { percent: covered }) }
      }
      stats={[
        {
          label: t("deposits"),
          value: formatMoney(data.deposit_amount),
          icon: WalletCards,
        },
        {
          label: t("bill"),
          value: formatMoney(data.final_bill),
          icon: ReceiptText,
        },
      ]}
    />
  );
}
