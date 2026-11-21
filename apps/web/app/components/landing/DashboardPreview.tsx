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
import { getTranslations } from "next-intl/server";
import { Avatar } from "./ui";

const STATS = [
  {
    key: "mealRate",
    value: "৳68.50",
    icon: TrendingUp,
    accent: true,
  },
  {
    key: "mealsToday",
    value: "14",
    icon: UtensilsCrossed,
  },
  {
    key: "expenses",
    value: "৳24,344",
    icon: ReceiptText,
  },
  {
    key: "deposits",
    value: "৳28,500",
    icon: Wallet,
  },
] as const;

const BALANCES = [
  {
    name: "Adal Nawab",
    initials: "AN",
    role: "MANAGER",
    amount: "+৳1,250",
    positive: true,
  },
  {
    name: "Fahad Karim",
    initials: "FK",
    role: "MEMBER",
    amount: "+৳320",
    positive: true,
  },
  {
    name: "Rahim Uddin",
    initials: "RU",
    role: "MEMBER",
    amount: "-৳480",
    positive: false,
  },
  {
    name: "Karim Mia",
    initials: "KM",
    role: "MEMBER",
    amount: "+৳610",
    positive: true,
  },
] as const;

const ACTIVITY = [
  { key: "dinner", who: "Adal", time: "10:42 AM", initials: "AN" },
  { key: "internet", who: "Rahim", time: "9:18 AM", initials: "RU" },
  { key: "deposit", who: "Fahad", time: null, initials: "FK" },
] as const;

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-3 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-primary/50">
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
      <p className="mt-1 font-heading text-xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-foreground-muted/80">{hint}</p>
    </div>
  );
}

export async function DashboardPreview() {
  const t = await getTranslations("landing.dashPreview");
  const tRole = await getTranslations("role");
  return (
    <div className="relative [transform-style:preserve-3d]">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-panel">
        <div className="flex items-center justify-between border-b border-border bg-surface-raised px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-destructive" />
            <span className="size-2.5 rounded-full bg-accent-warm" />
            <span className="size-2.5 rounded-full bg-success" />
            <span className="ml-2 text-xs text-foreground-muted">
              messmate.app/dashboard
            </span>
          </div>
          <div className="flex items-center gap-2 text-foreground-muted">
            <UserPlus className="size-4" />
            <MoreHorizontal className="size-4" />
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar initials="RM" />
              <div>
                <p className="text-sm font-bold text-foreground font-heading">
                  Riverside Mess
                </p>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-success">
                  <span className="size-1.5 rounded-full bg-success" />
                  {t("active")}
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 text-[11px] font-semibold text-foreground-muted">
              {t("month")} <ChevronDown className="size-3" />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {STATS.map((stat) => (
              <StatTile
                key={stat.key}
                label={t(`stats.${stat.key}.label`)}
                hint={t(`stats.${stat.key}.hint`)}
                value={stat.value}
                icon={stat.icon}
                accent={"accent" in stat ? stat.accent : false}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-raised p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground-muted">
                  {t("memberBalances")}
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
                        {tRole(row.role)}
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

            <div className="rounded-xl border border-border bg-surface-raised p-3.5">
              <p className="text-xs font-semibold text-foreground-muted">
                {t("recentActivity")}
              </p>
              <div className="mt-2.5 space-y-2.5">
                {ACTIVITY.map((row) => (
                  <div
                    key={`${row.who}-${t(`activity.${row.key}`)}`}
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
                        {t(`activity.${row.key}`)}
                      </p>
                      <p className="text-[10px] text-foreground-muted/70">
                        {row.time ?? t("yesterday")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tilt-pop absolute -right-6 -top-8 hidden w-44 rounded-2xl border border-border bg-surface-raised p-4 shadow-panel md:block">
        <p className="text-[11px] font-semibold text-foreground-muted">
          {t("todayRate")}
        </p>
        <p className="mt-1 font-heading text-2xl font-bold text-primary">
          ৳68.50
        </p>
        <div className="mt-2.5 space-y-1.5">
          {(
            [
              { label: "lunch", pct: "82%" },
              { label: "dinner", pct: "64%" },
              { label: "sehri", pct: "28%" },
            ] as const
          ).map((row) => (
            <div key={row.label}>
              <div className="flex justify-between text-[10px] text-foreground-muted">
                <span>{t(row.label)}</span>
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
    </div>
  );
}
