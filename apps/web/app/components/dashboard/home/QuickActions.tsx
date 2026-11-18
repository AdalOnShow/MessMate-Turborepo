"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Bell,
  ChefHat,
  Landmark,
  Receipt,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";
import { LinkPendingDot } from "../../ui/link-pending";

type Action = {
  href: string;
  icon: LucideIcon;
  label:
    | "actionMeals"
    | "actionExpense"
    | "actionDeposit"
    | "actionMembers"
    | "actionBazaar"
    | "actionReports"
    | "actionNotifications";
};

const MANAGER_ACTIONS: Action[] = [
  { href: "/dashboard/meals", icon: ChefHat, label: "actionMeals" },
  { href: "/dashboard/expenses", icon: Receipt, label: "actionExpense" },
  { href: "/dashboard/deposits", icon: Landmark, label: "actionDeposit" },
  { href: "/dashboard/members", icon: Users, label: "actionMembers" },
];

const MEMBER_ACTIONS: Action[] = [
  { href: "/dashboard/bazaar", icon: ShoppingCart, label: "actionBazaar" },
  { href: "/dashboard/reports", icon: BarChart3, label: "actionReports" },
  { href: "/dashboard/members", icon: Users, label: "actionMembers" },
  { href: "/dashboard/activity", icon: Bell, label: "actionNotifications" },
];

/** Row of round shortcut buttons, like a banking app. */
export function QuickActions({ isManager }: { isManager: boolean }) {
  const t = useTranslations("dashboard.home");
  const actions = isManager ? MANAGER_ACTIONS : MEMBER_ACTIONS;

  return (
    <nav
      aria-label={t("quickActions")}
      className="grid grid-cols-4 gap-2 lg:rounded-2xl lg:border lg:border-border lg:bg-surface lg:p-4"
    >
      {actions.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className="group relative flex min-w-0 flex-col items-center gap-1.5 rounded-xl py-1 text-center"
        >
          <span className="flex size-12 items-center justify-center rounded-full border border-border bg-surface text-primary transition-all duration-200 group-hover:border-primary/40 group-hover:bg-primary/10 group-active:scale-90 lg:bg-surface-raised">
            <Icon size={20} aria-hidden="true" />
          </span>
          <span className="w-full truncate text-xs font-medium text-foreground-muted transition-colors group-hover:text-foreground">
            {t(label)}
          </span>
          <LinkPendingDot className="absolute top-0 right-[calc(50%-1.75rem)]" />
        </Link>
      ))}
    </nav>
  );
}
