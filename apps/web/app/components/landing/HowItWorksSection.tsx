import {
  ArrowRight,
  CalendarCheck,
  CalendarPlus,
  Calculator,
  CheckCircle2,
  Download,
  ShoppingCart,
  UserPlus,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SectionHeading, richAccent } from "./ui";
import { Reveal } from "./Reveal";

type StepKey =
  | "account"
  | "members"
  | "month"
  | "meals"
  | "money"
  | "closeMonth";

interface Step {
  key: StepKey;
  icon: LucideIcon;
  /** Who does it; the first step can be anyone (they become the manager). */
  who: "manager" | "everyone";
}

/** The real order of using MessMate, grouped by when it happens. */
const PHASES: {
  key: "setup" | "daily" | "close";
  tone: string;
  steps: Step[];
}[] = [
  {
    key: "setup",
    tone: "text-primary bg-primary/10 border-primary/25",
    steps: [
      { key: "account", icon: UserPlus, who: "everyone" },
      { key: "members", icon: Users, who: "manager" },
      { key: "month", icon: CalendarPlus, who: "manager" },
    ],
  },
  {
    key: "daily",
    tone: "text-accent-warm bg-accent-warm/10 border-accent-warm/25",
    steps: [
      { key: "meals", icon: Utensils, who: "manager" },
      { key: "money", icon: ShoppingCart, who: "everyone" },
    ],
  },
  {
    key: "close",
    tone: "text-success bg-success/10 border-success/25",
    steps: [{ key: "closeMonth", icon: CalendarCheck, who: "manager" }],
  },
];

const MEMBER_ITEMS = ["join", "bazaar", "balance"] as const;

export async function HowItWorksSection() {
  const t = await getTranslations("landing.howItWorks");
  let number = 0;

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-border bg-surface-sunken py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t.rich("title", richAccent)}
          subtitle={t("subtitle")}
        />

        {/* Three stages, each with its numbered steps. */}
        <ol className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PHASES.map((phase, phaseIdx) => (
            <li key={phase.key} className="min-w-0">
              <Reveal delay={phaseIdx * 120} className="h-full">
                <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 sm:p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${phase.tone}`}
                    >
                      {t(`phases.${phase.key}.label`)}
                    </span>
                    <span className="text-xs text-foreground-muted">
                      {t(`phases.${phase.key}.hint`)}
                    </span>
                  </div>

                  <ol className="relative flex-1 space-y-6">
                    {phase.steps.map((step, i) => {
                      number += 1;
                      const Icon = step.icon;
                      const last = i === phase.steps.length - 1;
                      return (
                        <li key={step.key} className="relative flex gap-4">
                          {/* Connector line between steps of a stage. */}
                          {!last && (
                            <span
                              aria-hidden="true"
                              className="absolute left-5 top-11 -bottom-6 w-px bg-border"
                            />
                          )}
                          <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-raised text-primary">
                            <Icon size={18} aria-hidden="true" />
                            <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                              {number}
                            </span>
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <h3 className="font-heading text-base font-bold text-foreground">
                                {t(`steps.${step.key}.title`)}
                              </h3>
                              <span className="rounded-[5px] border border-border px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground-muted">
                                {t(step.who)}
                              </span>
                            </div>
                            <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
                              {t(`steps.${step.key}.description`)}
                            </p>
                            <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-md bg-background/60 px-2 py-1 text-xs text-foreground">
                              <span className="text-foreground-muted">
                                {t("where")}:
                              </span>
                              <span className="truncate font-medium">
                                {t(`steps.${step.key}.where`)}
                              </span>
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* The formulas, so nobody has to wonder where a number came from. */}
          <Reveal delay={100} className="lg:col-span-3">
            <div className="h-full rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Calculator
                  size={18}
                  className="text-primary"
                  aria-hidden="true"
                />
                <h3 className="font-heading text-base font-bold text-foreground">
                  {t("math.title")}
                </h3>
              </div>
              <ul className="mt-4 space-y-2.5 text-sm">
                {(["rate", "bill", "balance"] as const).map((key) => (
                  <li
                    key={key}
                    className="rounded-lg border border-border bg-surface px-3 py-2 font-medium text-foreground"
                  >
                    {t(`math.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* What a plain member does, in three lines. */}
          <Reveal delay={200} className="lg:col-span-2">
            <div className="h-full rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h3 className="font-heading text-base font-bold text-foreground">
                {t("member.title")}
              </h3>
              <ul className="mt-4 space-y-3">
                {MEMBER_ITEMS.map((key) => (
                  <li
                    key={key}
                    className="flex gap-2.5 text-sm text-foreground-muted"
                  >
                    <CheckCircle2
                      size={16}
                      className="mt-0.5 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    <span>{t(`member.items.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <a
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {t("cta")}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="/install"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-raised px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Download className="size-4" aria-hidden="true" />
            {t("install")}
          </a>
        </div>
      </div>
    </section>
  );
}
