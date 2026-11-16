import { Calculator, Check, ArrowRight } from "lucide-react";
import { SectionHeading } from "./ui";
import { Reveal } from "./Reveal";

const SETTLEMENT = [
  {
    who: "Adal Nawab",
    meals: 42,
    share: "৳2,877",
    deposits: "৳4,000",
    balance: "+৳1,123",
    positive: true,
  },
  {
    who: "Fahad Karim",
    meals: 38,
    share: "৳2,603",
    deposits: "৳2,200",
    balance: "-৳403",
    positive: false,
  },
  {
    who: "Rahim Uddin",
    meals: 40,
    share: "৳2,740",
    deposits: "৳2,800",
    balance: "+৳60",
    positive: true,
  },
  {
    who: "Karim Mia",
    meals: 36,
    share: "৳2,466",
    deposits: "৳2,500",
    balance: "+৳34",
    positive: true,
  },
];

export function AccountingSection() {
  return (
    <section
      id="accounting"
      className="scroll-mt-20 overflow-hidden bg-background py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              align="left"
              eyebrow="The Accounting System"
              title={
                <>
                  One Formula.{" "}
                  <span className="text-primary">Every Member Sees It.</span>
                </>
              }
              subtitle="MessMate does the month-end that used to take a calculator and a whiteboard — with the math fully visible to everyone in the mess."
            />

            <div className="mt-8 space-y-4">
              {[
                "Meal Rate is total spend divided by meals — computed instantly, updated live.",
                "Each member's bill is just their meals multiplied by the rate.",
                "Deposits are tracked per member, so paying up is explicit and checkable.",
                "Final balance = deposits paid minus meal share; carried forward clearly month to month.",
              ].map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="size-3.5" />
                  </span>
                  <p className="text-sm leading-relaxed text-foreground-muted">
                    {point}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-xs font-mono font-medium uppercase tracking-[0.12em]r text-primary">
                Formula
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 font-heading">
                <span className="rounded-lg bg-surface-raised px-3 py-2 text-sm font-bold text-foreground">
                  Meal Rate
                </span>
                <span className="text-foreground-muted">=</span>
                <span className="rounded-lg bg-surface-raised px-3 py-2 text-sm font-bold text-foreground">
                  Total Meal Cost
                </span>
                <span className="text-foreground-muted">÷</span>
                <span className="rounded-lg bg-surface-raised px-3 py-2 text-sm font-bold text-foreground">
                  Total Meals
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 font-heading">
                <span className="rounded-lg bg-surface-raised px-3 py-2 text-sm font-bold text-foreground">
                  Final Balance
                </span>
                <span className="text-foreground-muted">=</span>
                <span className="rounded-lg bg-surface-raised px-3 py-2 text-sm font-bold text-foreground">
                  Deposits Paid
                </span>
                <span className="text-foreground-muted">−</span>
                <span className="rounded-lg bg-surface-raised px-3 py-2 text-sm font-bold text-foreground">
                  Meal Share
                </span>
              </div>
            </div>
          </div>

          <Reveal delay={120}>
            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-panel">
                <div className="flex items-center justify-between border-b border-border bg-surface-raised px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="size-4 text-primary" />
                    <span className="text-sm font-bold text-foreground font-heading">
                      Month-End Settlement
                    </span>
                  </div>
                  <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                    August 2026
                  </span>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="rounded-xl bg-surface-raised/70 p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-foreground-muted">
                        Expenses
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-foreground">
                        ৳22,180
                      </p>
                    </div>
                    <div className="rounded-xl bg-surface-raised/70 p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-foreground-muted">
                        Meals
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-foreground">
                        324
                      </p>
                    </div>
                    <div className="rounded-xl bg-primary/10 p-3 text-center ring-1 ring-primary/30">
                      <p className="text-[10px] uppercase tracking-wider text-primary">
                        Meal Rate
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-primary">
                        ৳68.50
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-xl border border-border">
                    <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-1 border-b border-border bg-surface-raised/70 px-3 py-2 text-[10px] font-mono font-medium uppercase tracking-[0.12em]r text-foreground-muted">
                      <span>Member</span>
                      <span className="text-right">Meals</span>
                      <span className="text-right">Paid</span>
                      <span className="text-right">Balance</span>
                    </div>
                    {SETTLEMENT.map((row) => (
                      <div
                        key={row.who}
                        className="grid grid-cols-[1.2fr_1fr_1fr_1fr] items-center gap-1 border-b border-border px-3 py-2.5 last:border-0"
                      >
                        <span className="truncate text-xs font-semibold text-foreground">
                          {row.who}
                        </span>
                        <span className="text-right text-xs text-foreground-muted">
                          {row.meals}
                        </span>
                        <span className="text-right text-xs text-foreground-muted">
                          {row.deposits}
                        </span>
                        <span
                          className={`text-right text-xs font-bold ${
                            row.positive ? "text-success" : "text-destructive"
                          }`}
                        >
                          {row.balance}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-surface-raised/70 px-3.5 py-2.5">
                    <span className="text-[11px] text-foreground-muted">
                      Closing the month rolls balances forward
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                      Carry forward <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
