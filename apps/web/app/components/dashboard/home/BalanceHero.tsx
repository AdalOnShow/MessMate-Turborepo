"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowDownLeft, ArrowUpRight, Check } from "lucide-react";
import type {
  useMemberDashboard,
  useMessDashboard,
} from "@/app/hooks/use-members";
import { formatMoney } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";
import { QueryErrorState } from "../../feedback/QueryErrorState";
import { Skeleton } from "../../ui/skeleton";
import { balanceTone, toneText } from "./shared";

type Stat = { label: string; value: string; href?: string };

function HeroShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 sm:p-6">
      <div className="relative">{children}</div>
    </section>
  );
}

function HeroSkeleton() {
  return (
    <HeroShell>
      <Skeleton className="h-3.5 w-24 rounded" />
      <Skeleton className="mt-3 h-11 w-48" />
      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="h-5 w-20 rounded" />
          </div>
        ))}
      </div>
    </HeroShell>
  );
}

function BalanceBody({
  label,
  balance,
  note,
  stats,
}: {
  label: string;
  balance: number;
  note?: string;
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
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            tone === "success" && "bg-success/10 text-success",
            tone === "destructive" && "bg-destructive/10 text-destructive",
            tone === "neutral" && "bg-surface-raised text-foreground-muted",
          )}
        >
          {status.icon}
          {status.text}
        </span>
      </div>

      <p
        className={cn(
          "mt-2 text-4xl font-extrabold tracking-[-0.03em] tabular-nums sm:text-5xl",
          toneText[tone],
        )}
      >
        {balance < 0 ? "−" : ""}
        {formatMoney(Math.abs(balance))}
      </p>
      {note ? (
        <p className="mt-1.5 text-xs text-foreground-muted">{note}</p>
      ) : null}

      <dl
        className={cn(
          "mt-5 grid gap-2 border-t border-border pt-4",
          stats.length === 2 ? "grid-cols-2" : "grid-cols-3",
        )}
      >
        {stats.map((stat) => {
          const content = (
            <>
              <dt className="truncate text-[11px] font-medium text-foreground-muted">
                {stat.label}
              </dt>
              <dd className="mt-0.5 truncate text-base font-bold text-foreground tabular-nums sm:text-lg">
                {stat.value}
              </dd>
            </>
          );
          return stat.href ? (
            <Link
              key={stat.label}
              href={stat.href}
              className="-m-1.5 min-w-0 rounded-lg p-1.5 transition-colors hover:bg-surface-raised"
            >
              {content}
            </Link>
          ) : (
            <div key={stat.label} className="min-w-0">
              {content}
            </div>
          );
        })}
      </dl>
    </HeroShell>
  );
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

  return (
    <BalanceBody
      label={t("messBalance")}
      balance={data.total_balance}
      stats={[
        {
          label: t("deposits"),
          value: formatMoney(data.total_deposits),
          href: "/dashboard/deposits",
        },
        {
          label: t("expenses"),
          value: formatMoney(data.total_expenses),
          href: "/dashboard/expenses",
        },
        {
          label: t("members"),
          value: String(data.total_members),
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
      stats={[
        { label: t("deposits"), value: formatMoney(data.deposit_amount) },
        { label: t("bill"), value: formatMoney(data.final_bill) },
      ]}
    />
  );
}
