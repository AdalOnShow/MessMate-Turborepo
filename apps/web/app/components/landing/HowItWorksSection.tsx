import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SectionHeading, richAccent } from "./ui";
import { Reveal } from "./Reveal";

const STEPS = ["create", "invite", "record", "auto"] as const;

export async function HowItWorksSection() {
  const t = await getTranslations("landing.howItWorks");
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-border bg-surface-sunken py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            align="left"
            eyebrow={t("eyebrow")}
            title={t.rich("title", richAccent)}
            subtitle={t("subtitle")}
          />
          <a
            href="/signup"
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-surface-raised px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {t("cta")}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, idx) => (
            <Reveal key={step} delay={idx * 100}>
              <div className="group border-t border-border pt-5 transition-colors duration-300 hover:border-primary/60">
                <span className="font-mono text-sm font-semibold tracking-widest text-primary">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-lg font-bold text-foreground font-heading">
                  {t(`steps.${step}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                  {t(`steps.${step}.description`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
