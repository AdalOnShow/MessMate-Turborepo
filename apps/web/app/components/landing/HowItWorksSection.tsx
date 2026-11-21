import { getTranslations } from "next-intl/server";
import { Container, SectionHeading } from "./ui";

type StepKey =
  | "account"
  | "members"
  | "month"
  | "meals"
  | "money"
  | "closeMonth";

/** The real order of using MessMate, grouped by when it happens. */
const PHASES: {
  key: "setup" | "daily" | "close";
  steps: { key: StepKey; who: "manager" | "everyone" }[];
}[] = [
  {
    key: "setup",
    steps: [
      { key: "account", who: "everyone" },
      { key: "members", who: "manager" },
      { key: "month", who: "manager" },
    ],
  },
  {
    key: "daily",
    steps: [
      { key: "meals", who: "manager" },
      { key: "money", who: "everyone" },
    ],
  },
  { key: "close", steps: [{ key: "closeMonth", who: "manager" }] },
];

export async function HowItWorksSection() {
  const t = await getTranslations("landing.howItWorks");
  let number = 0;

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-t border-border bg-surface-sunken py-20 lg:py-28"
    >
      <Container>
        <SectionHeading title={t("title")} subtitle={t("subtitle")} />

        <ol className="mt-14 grid grid-cols-1 gap-x-10 gap-y-12 lg:grid-cols-3">
          {PHASES.map((phase) => (
            <li
              key={phase.key}
              className="min-w-0 border-t-2 border-primary/40 pt-5 transition-colors duration-300 hover:border-primary"
            >
              <p className="font-heading text-lg font-bold text-foreground">
                {t(`phases.${phase.key}.label`)}
              </p>
              <p className="text-sm text-foreground-muted">
                {t(`phases.${phase.key}.hint`)}
              </p>

              <ol className="mt-6 space-y-6">
                {phase.steps.map((step) => {
                  number += 1;
                  return (
                    <li key={step.key} className="group flex gap-4">
                      <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border-strong font-heading text-sm font-bold text-foreground transition-[background-color,border-color,color,transform] duration-300 group-hover:scale-110 group-hover:border-primary group-hover:bg-primary group-hover:text-white"
                      >
                        {number}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-heading text-base font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
                          {t(`steps.${step.key}.title`)}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                          {t(`steps.${step.key}.description`)}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-primary">
                          {t(step.who)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ol>

        <p className="mt-14 max-w-[64ch] border-l-2 border-accent-warm pl-4 text-[15px] leading-relaxed text-foreground-body">
          {t("carry")}
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="/signup"
            className="btn-lift inline-flex items-center justify-center rounded-[10px] bg-primary px-6 py-3 text-[15px] font-semibold text-white hover:bg-primary-hover"
          >
            {t("cta")}
          </a>
          <a
            href="/guide"
            className="inline-flex items-center justify-center rounded-[10px] px-4 py-3 text-[15px] font-semibold text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-foreground"
          >
            {t("guide")}
          </a>
        </div>
      </Container>
    </section>
  );
}
