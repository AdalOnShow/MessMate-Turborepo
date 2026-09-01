"use client";

import Link from "next/link";
import { ChefHat, Landmark, Receipt, SquarePen, Users } from "lucide-react";
import { useGetMyMess } from "../../hooks/use-messes";
import { BentoCard, CardHeading } from "./bento";

const ACTIONS = [
  {
    href: "/dashboard/meals",
    icon: ChefHat,
    label: "Add Meal",
    hint: "Record today's meals",
    managerOnly: false,
  },
  {
    href: "/dashboard/expenses",
    icon: Receipt,
    label: "Add Expense",
    hint: "Create shared or individual expense",
    managerOnly: true,
  },
  {
    href: "/dashboard/deposits",
    icon: Landmark,
    label: "Add Deposit",
    hint: "Record a member deposit",
    managerOnly: true,
  },
  {
    href: "/dashboard/members",
    icon: Users,
    label: "Manage Members",
    hint: "Roles, invites, and removal",
    managerOnly: true,
  },
] as const;

export function QuickActions() {
  const { data: myMess } = useGetMyMess();
  const isManager = myMess?.current_user_role === "MANAGER";

  const actions = ACTIONS.filter((a) => !a.managerOnly || isManager);

  return (
    <BentoCard className="flex flex-col p-6 lg:col-span-1">
      <CardHeading icon={<SquarePen size={15} />} title="Quick actions" />

      <div className="flex-1 space-y-2">
        {actions.map((a) => (
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
