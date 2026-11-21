import { getTranslations } from "next-intl/server";
import { Container, SectionHeading } from "./ui";
import { MonthRun } from "./MonthRun";

/** One month of a mess, told as you scroll: the calendar fills day by day
 *  while the six steps play out beside it (see MonthRun). */
export async function HowItWorksSection() {
  const t = await getTranslations("landing.howItWorks");

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-t border-border bg-surface-sunken py-20 lg:py-28"
    >
      <Container>
        <SectionHeading title={t("title")} subtitle={t("subtitle")} />

        <MonthRun />

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
            className="nav-link mx-4 self-start py-3 text-[15px] font-semibold text-foreground sm:self-auto"
          >
            {t("guide")}
          </a>
        </div>
      </Container>
    </section>
  );
}
