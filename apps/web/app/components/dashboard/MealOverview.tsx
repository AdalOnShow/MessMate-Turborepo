"use client";

import { ArrowRight, ChefHat, Utensils } from "lucide-react";
import { useGetActiveMonth } from "../../hooks/use-months";
import { useGetMonthMealSummary } from "../../hooks/use-meals";
import { useMessDashboard } from "../../hooks/use-members";
import { formatCompact } from "../../lib/format";
import { BentoCard, CardHeading, CardActionLink } from "./bento";

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "?";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function MealOverview({ messId }: { messId: string | undefined }) {
  const { data: activeMonth } = useGetActiveMonth(messId);
  const { data: summary } = useGetMonthMealSummary(messId, activeMonth?.id);
  const { data: dashboard } = useMessDashboard(messId);

  const topMembers = summary?.member_summaries?.slice(0, 5) ?? [];
  const maxMeals =
    topMembers.length > 0
      ? Math.max(...topMembers.map((m) => m.total_meals), 1)
      : 1;

  return (
    <BentoCard className="flex flex-col p-6 lg:col-span-1 lg:row-span-2">
      <CardHeading
        icon={<Utensils size={15} />}
        title="Meal overview"
        action={
          <CardActionLink href="/dashboard/meals/reports">
            Reports <ArrowRight size={12} />
          </CardActionLink>
        }
      />

      <div className="grid grid-cols-1 gap-2.5">
        <div className="rounded-xl border border-foreground-muted/10 bg-background/40 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
            <ChefHat size={12} className="text-primary" />
            Meals
          </p>
          <p className="mt-1.5 text-xl font-bold text-foreground">
            {formatCompact(dashboard?.total_meals ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-foreground-muted/10 bg-background/40 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
            Rate
          </p>
          <p className="mt-1.5 text-xl font-bold text-foreground">
            {dashboard?.meal_rate ? `৳${Math.round(dashboard.meal_rate)}` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-foreground-muted/10 bg-background/40 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
            Days
          </p>
          <p className="mt-1.5 text-xl font-bold text-foreground">
            {summary?.active_days ?? 0}
          </p>
        </div>
      </div>

      {summary?.member_summaries?.length ? (
        <div className="mt-5">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            Top members
          </p>
          <div className="space-y-2.5">
            {topMembers.map((m) => (
              <div key={m.member_id} className="group flex items-center gap-3">
                {m.user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.user.avatar}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-foreground-muted/10"
                  />
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                    {initials(m.user.name, m.user.email)}
                  </span>
                )}
                <span className="w-24 truncate text-sm text-foreground">
                  {m.user.name}
                </span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-foreground-muted/10">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-all duration-500"
                    style={{
                      width: `${Math.max(
                        (m.total_meals / maxMeals) * 100,
                        4,
                      )}%`,
                    }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-semibold text-foreground">
                  {formatCompact(m.total_meals)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-5 text-sm text-foreground-muted">
          No meals recorded this month yet.
        </p>
      )}
    </BentoCard>
  );
}
