import {
  UtensilsCrossed,
  ReceiptText,
  Wallet,
  CalendarRange,
  ShieldCheck,
} from "lucide-react";
import { SectionHeading, Avatar } from "./ui";
import { Reveal } from "./Reveal";

const EVENTS = [
  {
    icon: UtensilsCrossed,
    actor: "Adal",
    initials: "AN",
    text: "updated the Dinner meal record",
    when: "Just now",
    tag: "Meal",
    color: "text-primary bg-primary/10",
  },
  {
    icon: ReceiptText,
    actor: "Rahim",
    initials: "RU",
    text: "added Internet bill — ৳1,200",
    when: "2 hours ago",
    tag: "Expense",
    color: "text-accent-warm bg-accent-warm/10",
  },
  {
    icon: Wallet,
    actor: "Fahad",
    initials: "FK",
    text: "deposited ৳5,000 to the mess account",
    when: "Yesterday",
    tag: "Deposit",
    color: "text-success bg-success/10",
  },
  {
    icon: CalendarRange,
    actor: "Manager",
    initials: "MGR",
    text: "closed August 2026 and carried balances forward",
    when: "3 days ago",
    tag: "Month",
    color: "text-destructive bg-destructive/10",
  },
];

export function ActivitySection() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div className="relative rounded-2xl border border-foreground-muted/15 bg-surface p-6 shadow-2xl shadow-black/30 lg:p-8">
              <div className="absolute inset-y-8 left-9 w-px bg-foreground-muted/15" />
              <div className="space-y-6">
                {EVENTS.map((ev, i) => (
                  <div
                    key={`${ev.actor}-${ev.text}`}
                    className="relative flex gap-4 pl-0"
                  >
                    <div className="z-10 mt-0.5 flex flex-col items-center">
                      <span
                        className={`flex size-9 items-center justify-center rounded-full ring-1 ring-foreground-muted/15 ${ev.color}`}
                      >
                        <ev.icon className="size-4" />
                      </span>
                      {i < EVENTS.length - 1 && (
                        <span className="mt-1 w-px flex-1 bg-foreground-muted/15" />
                      )}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Avatar
                          initials={ev.initials}
                          className="!size-6 !text-[8px]"
                        />
                        <p className="text-sm leading-snug text-foreground-muted">
                          <span className="font-semibold text-foreground">
                            {ev.actor}
                          </span>{" "}
                          {ev.text}
                        </p>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[11px] text-foreground-muted/70">
                          {ev.when}
                        </span>
                        <span className="rounded bg-foreground-muted/10 px-1.5 py-0.5 text-[9px] font-bold text-foreground-muted">
                          {ev.tag}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <div>
            <SectionHeading
              align="left"
              eyebrow="Radical Transparency"
              title={
                <>
                  Every Action Leaves a{" "}
                  <span className="text-primary">Trace</span>
                </>
              }
              subtitle="Activity history is built into the heart of MessMate, not bolted on. Every meal edit, expense, deposit, and month transition is logged and visible to the whole mess."
            />
            <div className="mt-8 space-y-4 text-sm font-light leading-relaxed text-foreground-muted">
              <p>
                That means no more &ldquo;I never saw that entry&rdquo; —
                because the record is public to your mess and stamped with who
                did what and when.
              </p>
              <p>
                Role changes are logged too. If a manager is added or removed,
                the mess can see exactly when it happened. Accountability
                isn&apos;t an afterthought.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-success/25 bg-success/5 p-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-success/15 text-success">
                <ShieldCheck className="size-5" />
              </span>
              <p className="text-sm text-foreground-muted">
                <span className="font-semibold text-foreground">
                  Built-in audit trail.
                </span>{" "}
                You can audit the whole month before you close it — from the
                same screen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
