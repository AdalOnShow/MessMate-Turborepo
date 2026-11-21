import { getTranslations } from "next-intl/server";
import { DashboardPreview } from "./DashboardPreview";
import { PrimaryCta } from "./PrimaryCta";

/** Two beams hang from the top corners and meet over the headline; what they
 *  light is this month's mess dashboard. The only animated moment on the page. */
export async function HeroSection() {
  const t = await getTranslations("landing.hero");
  return (
    <section className="relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 lg:pb-28">
      <div aria-hidden="true" className="hero-spotlight -z-10">
        <div className="hero-spotlight-beam hero-spotlight-beam--left" />
        <div className="hero-spotlight-beam hero-spotlight-beam--right" />
      </div>

      <div className="hero-rise mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h1 className="landing-display mx-auto max-w-[22ch] text-balance text-foreground">
          {t("title")}
        </h1>
        <p className="mx-auto mt-6 max-w-[56ch] text-base leading-relaxed text-foreground-body sm:text-lg">
          {t("subtitle")}
        </p>

        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <PrimaryCta className="rounded-[10px] px-7 py-3.5 text-[15px]" />
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-[10px] border border-border-strong px-7 py-3.5 text-[15px] font-semibold text-foreground transition-colors hover:border-foreground-muted hover:bg-surface"
          >
            {t("secondary")}
          </a>
        </div>

        <p className="mt-6 text-sm text-foreground-muted">{t("trust")}</p>
      </div>

      <div
        id="preview"
        className="hero-rise mx-auto mt-16 max-w-4xl scroll-mt-24 px-4 sm:px-6 lg:mt-20"
      >
        <DashboardPreview />
      </div>
    </section>
  );
}
