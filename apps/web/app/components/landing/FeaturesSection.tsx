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
import { SectionHeading, Avatar } from "./ui";
import { Reveal } from "./Reveal";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  { label: "Bazaar — Weekly", amount: "৳4,250", tag: "Bazaar", by: "Adal" },
  { label: "Internet bill", amount: "৳1,200", tag: "Utility", by: "Rahim" },
  { label: "Gas refill", amount: "৳950", tag: "Utility", by: "Fahad" },
];

const DEPOSITS = [
  { name: "Adal Nawab", amount: "৳6,000", pct: "75%" },
  { name: "Rahim Uddin", amount: "৳4,000", pct: "50%" },
  { name: "Fahad Karim", amount: "৳5,500", pct: "69%" },
];

const MEMBER_ROWS = [
  { initials: "AN", name: "Adal Nawab", role: "Manager", highlight: true },
  { initials: "FK", name: "Fahad Karim", role: "Manager", highlight: true },
  { initials: "RU", name: "Rahim Uddin", role: "Member", highlight: false },
  { initials: "KM", name: "Karim Mia", role: "Member", highlight: false },
];

const TIMELINE = [
  { text: "Deposit recorded", who: "Rahim", when: "Today · 11:20 AM" },
  { text: "Dinner meal added", who: "Adal", when: "Today · 9:02 AM" },
  { text: "Bazaar expense approved", who: "Fahad", when: "Yesterday" },
  { text: "September month started", who: "Adal", when: "Sep 1" },
];

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
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-foreground-muted/10 bg-surface-raised/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-black/30 ${className}`}
    >
      <div className="flex items-start gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
          <Icon className="size-5" />
        </span>
        <div>
          <h3 className="font-bold text-foreground font-heading">{title}</h3>
          <p className="mt-1 text-sm font-light leading-relaxed text-foreground-muted">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-6 flex-1">{children}</div>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-20 bg-background py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          title={
            <>
              Everything Your Mess Needs,{" "}
              <span className="text-primary">Nothing It Doesn&apos;t</span>
            </>
          }
          subtitle="Six focused tools that replace the whole spreadsheet habit — clean, fast, and built specifically for shared living in Bangladesh."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <CardShell
              icon={UtensilsCrossed}
              title="Meal Tracking"
              description="Record who ate what, when. Dynamic meal types per mess — Lunch, Dinner, Sehri, or your own — with one-tap entry and bulk mode for managers."
            >
              <div className="h-full rounded-xl border border-foreground-muted/10 bg-background p-4">
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {WEEK.map((d) => (
                    <span
                      key={d}
                      className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted"
                    >
                      {d}
                    </span>
                  ))}
                  {MEAL_DAYS.map((day, i) => (
                    <div
                      key={i}
                      className={`rounded-lg p-1.5 text-center ${
                        i === 2
                          ? "bg-primary text-background shadow-[0_0_16px_rgba(6,182,212,0.45)]"
                          : "bg-surface-raised/80"
                      }`}
                    >
                      <span
                        className={`block text-[10px] font-semibold ${
                          i === 2 ? "text-background" : "text-foreground-muted"
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
                        {day.lunch}L
                      </span>
                      <span
                        className={`mt-0.5 block rounded px-0.5 text-[9px] font-bold ${
                          i === 2
                            ? "bg-background/20"
                            : "bg-accent-warm/10 text-accent-warm"
                        }`}
                      >
                        {day.dinner}D
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-foreground-muted/10 pt-3 text-xs">
                  <span className="font-semibold text-foreground">
                    Today&apos;s tally
                  </span>
                  <span className="text-foreground-muted">
                    14 meals ·{" "}
                    <span className="font-bold text-primary">5 members</span>
                  </span>
                </div>
              </div>
            </CardShell>
          </Reveal>

          <Reveal delay={90} className="md:col-span-2">
            <CardShell
              icon={ReceiptText}
              title="Expense Management"
              description="Log every taka as it's spent. Bazaar, utilities, gas — categorised, searchable, and always tied to a month."
            >
              <div className="space-y-2 rounded-xl border border-foreground-muted/10 bg-background p-3.5">
                {EXPENSES.map((e) => (
                  <div
                    key={e.label}
                    className="flex items-center justify-between gap-2 rounded-lg bg-surface-raised/70 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {e.label}
                      </p>
                      <span className="text-[10px] text-foreground-muted">
                        by {e.by}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-foreground">
                        {e.amount}
                      </p>
                      <span className="inline-flex rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                        {e.tag}
                      </span>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-foreground-muted/20 py-2 text-[11px] font-semibold text-foreground-muted transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Plus className="size-3.5" /> Add Expense
                </button>
              </div>
            </CardShell>
          </Reveal>

          <Reveal delay={90} className="md:col-span-2">
            <CardShell
              icon={Wallet}
              title="Deposit Tracking"
              description="One running ledger per member. See exactly who has paid, who hasn't, and what your mess is up to."
            >
              <div className="space-y-2.5 rounded-xl border border-foreground-muted/10 bg-background p-3.5">
                {DEPOSITS.map((d) => (
                  <div key={d.name}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        {d.name}
                      </span>
                      <span className="font-bold text-success">{d.amount}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground-muted/10">
                      <div
                        className="h-full rounded-full bg-success"
                        style={{ width: d.pct }}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 text-xs">
                  <span className="text-foreground-muted">Collected</span>
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
              title="Monthly Accounting"
              description="Meal rates, member bills, and net balances are calculated the same way every month — no arithmetic, no disputes."
            >
              <div className="rounded-xl border border-foreground-muted/10 bg-background p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex-1 rounded-lg bg-surface-raised/80 px-3.5 py-2.5 min-w-[130px]">
                    <p className="text-[10px] uppercase tracking-wider text-foreground-muted">
                      Total Expense
                    </p>
                    <p className="text-sm font-bold text-foreground">৳22,180</p>
                  </div>
                  <span className="font-bold text-primary">÷</span>
                  <div className="flex-1 rounded-lg bg-surface-raised/80 px-3.5 py-2.5 min-w-[110px]">
                    <p className="text-[10px] uppercase tracking-wider text-foreground-muted">
                      Total Meals
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">324</p>
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                        8 members
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-primary">=</span>
                  <div className="flex-1 rounded-lg bg-primary/10 ring-1 ring-primary/30 px-3.5 py-2.5 min-w-[130px]">
                    <p className="text-[10px] uppercase tracking-wider text-primary">
                      Meal Rate
                    </p>
                    <p className="text-sm font-bold text-primary">৳68.50</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-foreground-muted/10 pt-3">
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
                        ৳{(m.meals * 68.5).toLocaleString()}
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
              title="Activity History"
              description="Every meal, expense, deposit, and month transition leaves a trace. Nobody can claim they didn't see it — the record is public to the mess."
            >
              <div className="relative rounded-xl border border-foreground-muted/10 bg-background p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                    Mess-wide activity
                  </p>
                  <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-bold text-success">
                    Live
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {TIMELINE.map((row, i) => (
                    <div key={row.text} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="size-2 rounded-full bg-primary" />
                        {i < TIMELINE.length - 1 && (
                          <span className="w-px flex-1 bg-foreground-muted/15" />
                        )}
                      </div>
                      <div className="pb-1">
                        <p className="text-xs text-foreground-muted">
                          <span className="font-semibold text-foreground">
                            {row.who}
                          </span>{" "}
                          {row.text}
                        </p>
                        <span className="text-[10px] text-foreground-muted/70">
                          {row.when}
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
              title="Member Management"
              description="Invite with a secure code, set roles, and let the app handle who is who — up to two managers, clearly marked."
            >
              <div className="space-y-2 rounded-xl border border-foreground-muted/10 bg-background p-3.5">
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
                          {m.role}
                        </span>
                      )}
                    </div>
                    {m.highlight ? (
                      <Check className="size-4 text-success" />
                    ) : (
                      <span className="text-[10px] text-foreground-muted">
                        {m.role}
                      </span>
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-foreground-muted/20 py-2 text-[11px] font-semibold text-foreground-muted">
                  <Users className="size-3.5" /> Invite Member
                </div>
              </div>
            </CardShell>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
