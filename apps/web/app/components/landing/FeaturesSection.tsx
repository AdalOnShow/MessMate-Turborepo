import {
  UtensilsCrossed,
  ReceiptText,
  Wallet,
  Calculator,
  Users,
  Activity,
  Check,
  Plus,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SectionHeading, Avatar, richAccent } from "./ui";
import { Reveal } from "./Reveal";

const WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const MEAL_DAYS = [
  { lunch: 6, dinner: 5 },
  { lunch: 5, dinner: 6 },
  { lunch: 7, dinner: 6 },
  { lunch: 6, dinner: 4 },
  { lunch: 5, dinner: 5 },
  { lunch: 8, dinner: 7 },
  { lunch: 6, dinner: 6 },
];

const EXPENSES = [
  { key: "bazaar", amount: "৳4,250", tag: "bazaar", by: "Adal" },
  { key: "internet", amount: "৳1,200", tag: "utility", by: "Rahim" },
  { key: "gas", amount: "৳950", tag: "utility", by: "Fahad" },
] as const;

const DEPOSITS = [
  { name: "Adal Nawab", amount: "৳6,000", pct: "75%" },
  { name: "Rahim Uddin", amount: "৳4,000", pct: "50%" },
  { name: "Fahad Karim", amount: "৳5,500", pct: "69%" },
];

const MEMBER_ROWS = [
  { initials: "AN", name: "Adal Nawab", role: "MANAGER", highlight: true },
  { initials: "FK", name: "Fahad Karim", role: "MANAGER", highlight: true },
  { initials: "RU", name: "Rahim Uddin", role: "MEMBER", highlight: false },
  { initials: "KM", name: "Karim Mia", role: "MEMBER", highlight: false },
] as const;

const TIMELINE = [
  { key: "deposit", who: "Rahim", when: "today1120" },
  { key: "dinner", who: "Adal", when: "today902" },
  { key: "bazaar", who: "Fahad", when: "yesterday" },
  { key: "month", who: "Adal", when: "sep1" },
] as const;

function CardShell({
  icon: Icon,
  title,
  description,
  children,
  className = "",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-black/30 ${className}`}
    >
      <div className="flex items-start gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
          <Icon className="size-5" />
        </span>
        <div>
          <h3 className="font-bold text-foreground font-heading">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-6 flex-1">{children}</div>
    </div>
  );
}

export async function FeaturesSection() {
  const t = await getTranslations("landing.features");
  const tRole = await getTranslations("role");
  return (
    <section
      id="features"
      className="scroll-mt-20 bg-background py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t.rich("title", richAccent)}
          subtitle={t("subtitle")}
        />

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <CardShell
              icon={UtensilsCrossed}
              title={t("meals.title")}
              description={t("meals.description")}
            >
              <div className="h-full rounded-xl border border-border bg-background p-4">
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {WEEK.map((d) => (
                    <span
                      key={d}
                      className="text-[10px] font-mono font-medium uppercase tracking-[0.12em] text-foreground-muted"
                    >
                      {t(`week.${d}`)}
                    </span>
                  ))}
                  {MEAL_DAYS.map((day, i) => (
                    <div
                      key={i}
                      className={`rounded-lg p-1.5 text-center ${
                        i === 2
                          ? "bg-primary text-white"
                          : "bg-surface-raised/80"
                      }`}
                    >
                      <span
                        className={`block text-[10px] font-semibold ${
                          i === 2 ? "text-white" : "text-foreground-muted"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`mt-1 block rounded px-0.5 text-[9px] font-bold ${
                          i === 2
                            ? "bg-background/20"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {day.lunch}
                        {t("lunchShort")}
                      </span>
                      <span
                        className={`mt-0.5 block rounded px-0.5 text-[9px] font-bold ${
                          i === 2
                            ? "bg-background/20"
                            : "bg-accent-warm/10 text-accent-warm"
                        }`}
                      >
                        {day.dinner}
                        {t("dinnerShort")}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
                  <span className="font-semibold text-foreground">
                    {t("meals.todayTally")}
                  </span>
                  <span className="text-foreground-muted">
                    {t("meals.mealsCount", { count: 14 })} ·{" "}
                    <span className="font-bold text-primary">
                      {t("meals.membersCount", { count: 5 })}
                    </span>
                  </span>
                </div>
              </div>
            </CardShell>
          </Reveal>

          <Reveal delay={90} className="md:col-span-2">
            <CardShell
              icon={ReceiptText}
              title={t("expenses.title")}
              description={t("expenses.description")}
            >
              <div className="space-y-2 rounded-xl border border-border bg-background p-3.5">
                {EXPENSES.map((e) => (
                  <div
                    key={e.key}
                    className="flex items-center justify-between gap-2 rounded-lg bg-surface-raised/70 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {t(`expenses.rows.${e.key}`)}
                      </p>
                      <span className="text-[10px] text-foreground-muted">
                        {t("expenses.by", { name: e.by })}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-foreground">
                        {e.amount}
                      </p>
                      <span className="inline-flex rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                        {t(`expenses.tags.${e.tag}`)}
                      </span>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-strong py-2 text-[11px] font-semibold text-foreground-muted transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Plus className="size-3.5" /> {t("expenses.add")}
                </button>
              </div>
            </CardShell>
          </Reveal>

          <Reveal delay={90} className="md:col-span-2">
            <CardShell
              icon={Wallet}
              title={t("deposits.title")}
              description={t("deposits.description")}
            >
              <div className="space-y-2.5 rounded-xl border border-border bg-background p-3.5">
                {DEPOSITS.map((d) => (
                  <div key={d.name}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        {d.name}
                      </span>
                      <span className="font-bold text-success">{d.amount}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-raised">
                      <div
                        className="h-full rounded-full bg-success"
                        style={{ width: d.pct }}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 text-xs">
                  <span className="text-foreground-muted">
                    {t("deposits.collected")}
                  </span>
                  <span className="font-bold text-primary">
                    ৳28,500 / ৳30,000
                  </span>
                </div>
              </div>
            </CardShell>
          </Reveal>

          <Reveal className="md:col-span-4">
            <CardShell
              icon={Calculator}
              title={t("accounting.title")}
              description={t("accounting.description")}
            >
              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex-1 rounded-lg bg-surface-raised/80 px-3.5 py-2.5 min-w-[130px]">
                    <p className="text-[10px] uppercase tracking-wider text-foreground-muted">
                      {t("accounting.totalExpense")}
                    </p>
                    <p className="text-sm font-bold text-foreground">৳22,180</p>
                  </div>
                  <span className="font-bold text-primary">÷</span>
                  <div className="flex-1 rounded-lg bg-surface-raised/80 px-3.5 py-2.5 min-w-[110px]">
                    <p className="text-[10px] uppercase tracking-wider text-foreground-muted">
                      {t("accounting.totalMeals")}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">324</p>
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                        {t("meals.membersCount", { count: 8 })}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-primary">=</span>
                  <div className="flex-1 rounded-lg bg-primary/10 ring-1 ring-primary/30 px-3.5 py-2.5 min-w-[130px]">
                    <p className="text-[10px] uppercase tracking-wider text-primary">
                      {t("accounting.mealRate")}
                    </p>
                    <p className="text-sm font-bold text-primary">৳68.50</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
                  {[
                    { who: "Adal", meals: 42 },
                    { who: "Rahim", meals: 40 },
                    { who: "Fahad", meals: 38 },
                    { who: "Karim", meals: 36 },
                  ].map((m) => (
                    <span
                      key={m.who}
                      className="rounded-lg bg-surface-raised/80 px-2.5 py-1.5 text-[11px] text-foreground-muted"
                    >
                      <span className="font-semibold text-foreground">
                        {m.who}
                      </span>{" "}
                      {m.meals} × ৳68.50 ={" "}
                      <span className="font-bold text-foreground">
                        ৳{(m.meals * 68.5).toLocaleString("en-US")}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </CardShell>
          </Reveal>

          <Reveal className="md:col-span-4">
            <CardShell
              icon={Activity}
              title={t("activity.title")}
              description={t("activity.description")}
            >
              <div className="relative rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-foreground-muted">
                    {t("activity.label")}
                  </p>
                  <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-bold text-success">
                    {t("activity.live")}
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {TIMELINE.map((row, i) => (
                    <div key={row.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="size-2 rounded-full bg-primary" />
                        {i < TIMELINE.length - 1 && (
                          <span className="w-px flex-1 bg-surface-overlay" />
                        )}
                      </div>
                      <div className="pb-1">
                        <p className="text-xs text-foreground-muted">
                          <span className="font-semibold text-foreground">
                            {row.who}
                          </span>{" "}
                          {t(`activity.rows.${row.key}`)}
                        </p>
                        <span className="text-[10px] text-foreground-muted/70">
                          {t(`activity.when.${row.when}`)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardShell>
          </Reveal>

          <Reveal delay={90} className="md:col-span-2">
            <CardShell
              icon={Users}
              title={t("members.title")}
              description={t("members.description")}
            >
              <div className="space-y-2 rounded-xl border border-border bg-background p-3.5">
                {MEMBER_ROWS.map((m) => (
                  <div
                    key={m.name}
                    className="flex items-center gap-2.5 rounded-lg bg-surface-raised/70 px-3 py-2"
                  >
                    <Avatar
                      initials={m.initials}
                      className="!size-7 !text-[10px]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {m.name}
                      </p>
                      {m.highlight && (
                        <span className="text-[10px] font-semibold text-accent-warm">
                          {tRole(m.role)}
                        </span>
                      )}
                    </div>
                    {m.highlight ? (
                      <Check className="size-4 text-success" />
                    ) : (
                      <span className="text-[10px] text-foreground-muted">
                        {tRole(m.role)}
                      </span>
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-strong py-2 text-[11px] font-semibold text-foreground-muted">
                  <Users className="size-3.5" /> {t("members.invite")}
                </div>
              </div>
            </CardShell>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
