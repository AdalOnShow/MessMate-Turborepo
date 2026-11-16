import {
  TrendingUp,
  Wallet,
  ReceiptText,
  UtensilsCrossed,
  MoreHorizontal,
  ChevronDown,
  UserPlus,
  Plus,
} from "lucide-react";
import { Avatar } from "./ui";

const STATS = [
  {
    label: "Meal Rate",
    value: "৳68.50",
    hint: "+৳2.00 vs yesterday",
    icon: TrendingUp,
    accent: true,
  },
  {
    label: "Meals Today",
    value: "14",
    hint: "9 logged · 4 left",
    icon: UtensilsCrossed,
  },
  {
    label: "Total Expenses",
    value: "৳22,180",
    hint: "12 records this month",
    icon: ReceiptText,
  },
  {
    label: "Total Deposits",
    value: "৳28,500",
    hint: "8 members paid",
    icon: Wallet,
  },
];

const BALANCES = [
  {
    name: "Adal Nawab",
    initials: "AN",
    role: "Manager",
    amount: "+৳1,250",
    positive: true,
  },
  {
    name: "Fahad Karim",
    initials: "FK",
    role: "Member",
    amount: "+৳320",
    positive: true,
  },
  {
    name: "Rahim Uddin",
    initials: "RU",
    role: "Member",
    amount: "-৳480",
    positive: false,
  },
  {
    name: "Karim Mia",
    initials: "KM",
    role: "Member",
    amount: "+৳610",
    positive: true,
  },
];

const ACTIVITY = [
  {
    text: "updated Dinner meal",
    who: "Adal",
    time: "10:42 AM",
    initials: "AN",
  },
  {
    text: "added Internet bill",
    who: "Rahim",
    time: "9:18 AM",
    initials: "RU",
  },
  { text: "deposited ৳5,000", who: "Fahad", time: "Yesterday", initials: "FK" },
];

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: (typeof STATS)[number]) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised/70 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-foreground-muted">{label}</span>
        <span
          className={`flex size-6 items-center justify-center rounded-lg ${
            accent
              ? "bg-primary/15 text-primary"
              : "bg-surface-raised text-foreground-muted"
          }`}
        >
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="mt-1 text-lg font-bold tracking-tight text-foreground font-heading">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-foreground-muted/80">{hint}</p>
    </div>
  );
}

export function DashboardPreview() {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-panel">
        <div className="flex items-center justify-between border-b border-border bg-surface-raised px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-destructive" />
            <span className="size-2.5 rounded-full bg-accent-warm" />
            <span className="size-2.5 rounded-full bg-success" />
            <span className="ml-2 font-mono text-[11px] text-foreground-muted">
              messmate.app/dashboard
            </span>
          </div>
          <div className="flex items-center gap-2 text-foreground-muted">
            <UserPlus className="size-4" />
            <MoreHorizontal className="size-4" />
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar initials="RM" />
              <div>
                <p className="text-sm font-bold text-foreground font-heading">
                  Riverside Mess
                </p>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-success">
                  <span className="size-1.5 rounded-full bg-success" />
                  Active
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 text-[11px] font-semibold text-foreground-muted">
              August 2026 <ChevronDown className="size-3" />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {STATS.map((stat) => (
              <StatTile key={stat.label} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-raised/70 p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-mono font-medium uppercase tracking-[0.12em]r text-foreground-muted">
                  Member Balances
                </p>
                <Plus className="size-3.5 text-foreground-muted" />
              </div>
              <div className="mt-2.5 space-y-2">
                {BALANCES.map((row) => (
                  <div key={row.name} className="flex items-center gap-2.5">
                    <Avatar
                      initials={row.initials}
                      className="!size-6 !text-[9px]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {row.name}
                      </p>
                      <p className="text-[10px] text-foreground-muted">
                        {row.role}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        row.positive ? "text-success" : "text-destructive"
                      }`}
                    >
                      {row.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-raised/70 p-3.5">
              <p className="text-[11px] font-mono font-medium uppercase tracking-[0.12em]r text-foreground-muted">
                Recent Activity
              </p>
              <div className="mt-2.5 space-y-2.5">
                {ACTIVITY.map((row) => (
                  <div
                    key={`${row.who}-${row.text}`}
                    className="flex items-start gap-2.5"
                  >
                    <Avatar
                      initials={row.initials}
                      className="!size-6 !text-[9px]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-snug text-foreground-muted">
                        <span className="font-semibold text-foreground">
                          {row.who}
                        </span>{" "}
                        {row.text}
                      </p>
                      <p className="text-[10px] text-foreground-muted/70">
                        {row.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-4 -top-6 hidden w-44 rounded-2xl border border-border bg-surface-raised p-4 shadow-panel md:block">
        <p className="text-[10px] font-mono font-medium uppercase tracking-[0.12em]r text-foreground-muted">
          Today&apos;s Meal Rate
        </p>
        <p className="mt-1 text-xl font-bold text-primary font-heading">
          ৳68.50
        </p>
        <div className="mt-2.5 space-y-1.5">
          {[
            { label: "Lunch", pct: "82%" },
            { label: "Dinner", pct: "64%" },
            { label: "Sehri", pct: "28%" },
          ].map((row) => (
            <div key={row.label}>
              <div className="flex justify-between text-[10px] text-foreground-muted">
                <span>{row.label}</span>
                <span>{row.pct}</span>
              </div>
              <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-surface-raised">
                <div
                  className="h-full rounded-full bg-primary/80"
                  style={{ width: row.pct }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-6 -left-4 hidden w-40 rounded-2xl border border-border bg-surface-raised p-4 shadow-panel md:block">
        <p className="text-[10px] font-mono font-medium uppercase tracking-[0.12em]r text-foreground-muted">
          Your Balance
        </p>
        <p className="mt-1 text-lg font-bold text-success font-heading">
          +৳1,250
        </p>
        <div className="mt-2 flex items-end gap-1">
          {[35, 55, 40, 70, 55, 85, 60].map((h, i) => (
            <span
              key={i}
              className="w-2.5 rounded-sm bg-primary/70"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
        <p className="mt-1.5 text-[10px] text-foreground-muted">This month</p>
      </div>
    </div>
  );
}
