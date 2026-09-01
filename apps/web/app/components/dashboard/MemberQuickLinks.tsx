"use client";

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
    label: "Add Meal",
    hint: "Record today's meals",
  },
  {
    href: "/dashboard/bazaar",
    icon: ShoppingCart,
    label: "Bazaar",
    hint: "Submit and track bazaar",
  },
  {
    href: "/dashboard/meals/reports",
    icon: BarChart3,
    label: "Meals Reports",
    hint: "Daily, member, and monthly",
  },
  {
    href: "/dashboard/members",
    icon: Users,
    label: "Members",
    hint: "View mess members",
  },
] as const;

export function MemberQuickLinks() {
  return (
    <BentoCard className="flex flex-col p-6 lg:col-span-1">
      <CardHeading icon={<SquarePen size={15} />} title="Quick links" />

      <div className="flex-1 space-y-2">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-3 rounded-xl border border-foreground-muted/10 bg-background/40 px-3.5 py-3 transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
