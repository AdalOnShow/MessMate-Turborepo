import {
  LayoutDashboard,
  UtensilsCrossed,
  ReceiptText,
  FileBarChart,
} from "lucide-react";
import { SectionHeading, Avatar } from "./ui";
import { Reveal } from "./Reveal";

function BrowserFrame({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-foreground-muted/15 bg-surface shadow-xl shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-foreground-muted/10 bg-surface-raised px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-destructive" />
          <span className="size-2.5 rounded-full bg-accent-warm" />
          <span className="size-2.5 rounded-full bg-success" />
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground-muted">
          <Icon className="size-3.5 text-primary" />
          {title}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function DashboardMock() {
  return (
    <BrowserFrame title="Dashboard" icon={LayoutDashboard}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar initials="RM" className="!size-8" />
          <div>
            <p className="text-xs font-bold text-foreground">Riverside Mess</p>
            <p className="text-[10px] text-foreground-muted">August 2026</p>
          </div>
        </div>
        <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
          ৳68.50 / meal
        </span>
      </div>
      <div className="mt-3.5 grid grid-cols-4 gap-2">
        {[
          { l: "Meals", v: "324" },
          { l: "Expense", v: "৳22k" },
          { l: "Deposits", v: "৳28.5k" },
          { l: "Balance", v: "৳2.3k" },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-lg bg-surface-raised/70 p-2 text-center"
          >
            <p className="text-[9px] uppercase tracking-wide text-foreground-muted">
              {s.l}
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-foreground">
              {s.v}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-16 items-end gap-1.5">
        {[24, 40, 30, 52, 38, 62, 48, 70, 58, 44, 66, 54].map((h, i) => (
          <span
            key={i}
            className={`flex-1 rounded-sm ${
              i === 7 ? "bg-primary" : "bg-primary/25"
            }`}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
    </BrowserFrame>
  );
}

function MealsMock() {
  return (
    <BrowserFrame title="Meal Tracking" icon={UtensilsCrossed}>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
          Wednesday · Lunch
        </p>
        <span className="rounded bg-success/10 px-1.5 py-0.5 text-[9px] font-bold text-success">
          Saved
        </span>
      </div>
      <div className="space-y-1.5">
        {[
          { n: "Adal Nawab", i: "AN", yes: true },
          { n: "Rahim Uddin", i: "RU", yes: true },
          { n: "Fahad Karim", i: "FK", yes: false },
          { n: "Karim Mia", i: "KM", yes: true },
        ].map((m) => (
          <div
            key={m.n}
            className="flex items-center justify-between rounded-lg bg-surface-raised/70 px-2.5 py-1.5"
          >
            <div className="flex items-center gap-2">
              <Avatar initials={m.i} className="!size-5 !text-[8px]" />
              <span className="text-[11px] font-medium text-foreground">
                {m.n}
              </span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                m.yes
                  ? "bg-success/15 text-success"
                  : "bg-foreground-muted/10 text-foreground-muted"
              }`}
            >
              {m.yes ? "Ate" : "Skip"}
            </span>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function ExpensesMock() {
  return (
    <BrowserFrame title="Expense Management" icon={ReceiptText}>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
          August 2026
        </p>
        <span className="text-[11px] font-bold text-foreground">
          ৳22,180{" "}
          <span className="font-normal text-foreground-muted">total</span>
        </span>
      </div>
      <div className="space-y-1.5">
        {[
          { l: "Bazaar — Weekly", by: "Adal", a: "৳4,250", c: "Bazaar" },
          { l: "Internet bill", by: "Rahim", a: "৳1,200", c: "Utility" },
          { l: "Gas refill", by: "Fahad", a: "৳950", c: "Utility" },
          { l: "Cleaning supplies", by: "Karim", a: "৳480", c: "Other" },
        ].map((e) => (
          <div
            key={e.l}
            className="flex items-center justify-between rounded-lg bg-surface-raised/70 px-2.5 py-1.5"
          >
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-foreground">
                {e.l}
              </p>
              <span className="text-[9px] text-foreground-muted">
                by {e.by}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-foreground">{e.a}</p>
              <span className="rounded bg-primary/10 px-1 py-0.5 text-[8px] font-semibold text-primary">
                {e.c}
              </span>
            </div>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function ReportMock() {
  return (
    <BrowserFrame title="Monthly Report" icon={FileBarChart}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
          August 2026 · Summary
        </p>
        <span className="rounded bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
          Archived
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {[
          { l: "Meal Rate", v: "৳68.50", c: "text-primary" },
          { l: "Total Meals", v: "324", c: "text-foreground" },
          { l: "Net Balance", v: "+৳814", c: "text-success" },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-lg bg-surface-raised/70 p-2.5 text-center"
          >
            <p className="text-[9px] uppercase tracking-wide text-foreground-muted">
              {s.l}
            </p>
            <p className={`mt-0.5 text-sm font-bold ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-2.5 space-y-1.5">
        {[
          { l: "Adal Nawab", v: "+৳1,123", ok: true },
          { l: "Fahad Karim", v: "-৳403", ok: false },
          { l: "Rahim Uddin", v: "+৳60", ok: true },
        ].map((r) => (
          <div
            key={r.l}
            className="flex items-center justify-between rounded-lg bg-surface-raised/70 px-2.5 py-1.5"
          >
            <span className="text-[11px] font-medium text-foreground">
              {r.l}
            </span>
            <span
              className={`text-[11px] font-bold ${r.ok ? "text-success" : "text-destructive"}`}
            >
              {r.v}
            </span>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

export function ProductPreviewSection() {
  return (
    <section
      id="preview"
      className="scroll-mt-20 border-y border-foreground-muted/10 bg-surface py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Preview"
          title={
            <>
              A Look Inside,{" "}
              <span className="text-primary">Not a Screenshot in Sight</span>
            </>
          }
          subtitle="Real product screens drawn with the same interface you'll use — every figure is the actual design language of MessMate."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          <Reveal>
            <DashboardMock />
          </Reveal>
          <Reveal delay={110} className="md:mt-10">
            <MealsMock />
          </Reveal>
          <Reveal delay={60}>
            <ExpensesMock />
          </Reveal>
          <Reveal delay={170} className="md:mt-10">
            <ReportMock />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
