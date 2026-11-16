"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  BarChart3,
  ChefHat,
  ShoppingCart,
  SquarePen,
  Users,
} from "lucide-react";
import { BentoCard, CardHeading } from "./bento";

const ACTIONS = [
  {
    href: "/dashboard/meals",
    icon: ChefHat,
    label: "addMeal",
    hint: "recordTodaySMeals",
  },
  {
    href: "/dashboard/bazaar",
    icon: ShoppingCart,
    label: "Bazaar",
    hint: "submitTrackBazaar",
  },
  {
    href: "/dashboard/meals/reports",
    icon: BarChart3,
    label: "mealsReports",
    hint: "dailyMemberMonthly",
  },
  {
    href: "/dashboard/members",
    icon: Users,
    label: "Members",
    hint: "viewMessMembers",
  },
] as const;

export function MemberQuickLinks() {
  const t = useTranslations("dashboard.memberQuickLinks");
  return (
    <BentoCard className="flex flex-col p-6 lg:col-span-1">
      <CardHeading icon={<SquarePen size={15} />} title={t("quickLinks")} />

      <div className="flex-1 space-y-2">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-3 rounded-xl border border-border bg-background/40 px-3.5 py-3 transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
              <a.icon size={16} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">
                {a.label}
              </span>
              <span className="block truncate text-xs text-foreground-muted">
                {a.hint}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </BentoCard>
  );
}
