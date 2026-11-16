import {
  CalendarRange,
  Calculator,
  Archive,
  CalendarPlus,
  ArrowLeftRight,
  ChevronRight,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SectionHeading, richAccent } from "./ui";
import { Reveal } from "./Reveal";

const FLOW = [
  {
    icon: CalendarRange,
    key: "current",
  },
  {
    icon: Calculator,
    key: "calculate",
  },
  {
    icon: Archive,
    key: "close",
  },
  {
    icon: CalendarPlus,
    key: "start",
  },
  {
    icon: ArrowLeftRight,
    key: "carry",
  },
] as const;

export async function MonthFlowSection() {
  const t = await getTranslations("landing.monthFlow");
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t.rich("title", richAccent)}
          subtitle={t("subtitle")}
        />

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5 lg:gap-3">
          {FLOW.map((step, idx) => (
            <Reveal key={step.key} delay={idx * 100}>
              <div className="relative flex h-full flex-col rounded-2xl border border-border bg-surface-raised/50 p-6 transition-all duration-300 hover:border-primary/30 hover:bg-surface-raised">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
                    <step.icon className="size-5" />
                  </span>
                  <span className="font-mono text-xs font-bold text-primary/60">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-bold text-foreground font-heading">
                  {t(`steps.${step.key}.title`)}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground-muted">
                  {t(`steps.${step.key}.description`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mx-auto mt-10 flex max-w-3xl items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center sm:justify-center sm:gap-4">
            <span className="hidden sm:inline-flex">
              <ChevronRight className="size-5 text-primary" />
            </span>
            <p className="text-sm leading-relaxed text-foreground-muted">
              {t.rich("note", {
                strong: (c) => (
                  <span className="font-semibold text-foreground">{c}</span>
                ),
              })}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
