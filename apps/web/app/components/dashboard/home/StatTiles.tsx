"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, ChefHat, Tag } from "lucide-react";
import { formatCompact, formatMoney } from "@/app/lib/format";
import { Skeleton } from "../../ui/skeleton";

function Tile({
  icon,
  label,
  value,
  loading,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-surface px-3 py-3 sm:px-4 sm:py-3.5">
      <p className="flex items-center gap-1.5 truncate text-[11px] font-medium text-foreground-muted">
        <span className="text-primary [&_svg]:size-3.5">{icon}</span>
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-1.5 h-6 w-12 rounded" />
      ) : (
        <p className="mt-1 truncate text-lg font-bold text-foreground tabular-nums sm:text-xl">
          {value}
        </p>
      )}
    </div>
  );
}

/** Three small tiles: meals, meal rate and days counted this month. */
export function StatTiles({
  meals,
  mealRate,
  days,
  mine = false,
  loading = false,
}: {
  meals: number | undefined;
  mealRate: number | undefined;
  days: number | undefined;
  mine?: boolean;
  loading?: boolean;
}) {
  const t = useTranslations("dashboard.home");
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
      <Tile
        icon={<ChefHat />}
        label={mine ? t("myMeals") : t("meals")}
        value={formatCompact(meals ?? 0)}
        loading={loading}
      />
      <Tile
        icon={<Tag />}
        label={t("mealRate")}
        value={
          typeof mealRate === "number" ? formatMoney(Math.round(mealRate)) : "—"
        }
        loading={loading}
      />
      <Tile
        icon={<CalendarDays />}
        label={t("days")}
        value={typeof days === "number" ? String(days) : "—"}
        loading={loading}
      />
    </div>
  );
}
