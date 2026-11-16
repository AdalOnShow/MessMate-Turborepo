import {
  LayoutDashboard,
  UtensilsCrossed,
  ReceiptText,
  FileBarChart,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SectionHeading, Avatar, richAccent } from "./ui";
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
      className={`overflow-hidden rounded-2xl border border-border bg-surface shadow-panel transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-border bg-surface-raised px-4 py-2.5">
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

async function DashboardMock() {
  const t = await getTranslations("landing.preview");
  return (
    <BrowserFrame title={t("frames.dashboard")} icon={LayoutDashboard}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar initials="RM" className="!size-8" />
          <div>
            <p className="text-xs font-bold text-foreground">{t("messName")}</p>
            <p className="text-[10px] text-foreground-muted">{t("month")}</p>
          </div>
        </div>
        <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
          {t("perMeal")}
        </span>
      </div>
      <div className="mt-3.5 grid grid-cols-4 gap-2">
        {([
          { l: "meals", v: "324" },
          { l: "expense", v: "৳22k" },
          { l: "deposits", v: "৳28.5k" },
          { l: "balance", v: "৳2.3k" },
        ] as const).map((s) => (
          <div
            key={t(`stats.${s.l}`)}
            className="rounded-lg bg-surface-raised/70 p-2 text-center"
          >
            <p className="text-[9px] uppercase tracking-wide text-foreground-muted">
              {t(`stats.${s.l}`)}
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

async function MealsMock() {
  const t = await getTranslations("landing.preview");
  return (
    <BrowserFrame title={t("frames.meals")} icon={UtensilsCrossed}>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[10px] font-mono font-medium uppercase tracking-[0.12em] text-foreground-muted">
          {t("mealSlot")}
        </p>
        <span className="rounded bg-success/10 px-1.5 py-0.5 text-[9px] font-bold text-success">
          {t("saved")}
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
                  : "bg-surface-raised text-foreground-muted"
              }`}
            >
              {m.yes ? t("ate") : t("skip")}
            </span>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

async function ExpensesMock() {
  const t = await getTranslations("landing.preview");
  return (
    <BrowserFrame title={t("frames.expenses")} icon={ReceiptText}>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[10px] font-mono font-medium uppercase tracking-[0.12em] text-foreground-muted">
          {t("month")}
        </p>
        <span className="text-[11px] font-bold text-foreground">
          ৳22,180{" "}
          <span className="font-normal text-foreground-muted">{t("total")}</span>
        </span>
      </div>
      <div className="space-y-1.5">
        {([
          { l: "bazaar", by: "Adal", a: "৳4,250", c: "bazaar" },
          { l: "internet", by: "Rahim", a: "৳1,200", c: "utility" },
          { l: "gas", by: "Fahad", a: "৳950", c: "utility" },
          { l: "cleaning", by: "Karim", a: "৳480", c: "other" },
        ] as const).map((e) => (
          <div
            key={t(`expenseRows.${e.l}`)}
            className="flex items-center justify-between rounded-lg bg-surface-raised/70 px-2.5 py-1.5"
          >
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-foreground">
                {t(`expenseRows.${e.l}`)}
              </p>
              <span className="text-[9px] text-foreground-muted">
                {t("by", { name: e.by })}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-foreground">{e.a}</p>
              <span className="rounded bg-primary/10 px-1 py-0.5 text-[8px] font-semibold text-primary">
                {t(`tags.${e.c}`)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

async function ReportMock() {
  const t = await getTranslations("landing.preview");
  return (
    <BrowserFrame title={t("frames.report")} icon={FileBarChart}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono font-medium uppercase tracking-[0.12em] text-foreground-muted">
          {t("summary")}
        </p>
        <span className="rounded bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
          {t("archived")}
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {([
          { l: "mealRate", v: "৳68.50", c: "text-primary" },
          { l: "totalMeals", v: "324", c: "text-foreground" },
          { l: "netBalance", v: "+৳814", c: "text-success" },
        ] as const).map((s) => (
          <div
            key={t(`stats.${s.l}`)}
            className="rounded-lg bg-surface-raised/70 p-2.5 text-center"
          >
            <p className="text-[9px] uppercase tracking-wide text-foreground-muted">
              {t(`stats.${s.l}`)}
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

export async function ProductPreviewSection() {
  const t = await getTranslations("landing.preview");
  return (
    <section
      id="preview"
      className="scroll-mt-20 border-y border-border bg-surface-sunken py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t.rich("title", richAccent)}
          subtitle={t("subtitle")}
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
