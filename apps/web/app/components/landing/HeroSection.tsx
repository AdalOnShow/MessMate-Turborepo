import { getTranslations } from "next-intl/server";
import { richAccent } from "./ui";
import { ArrowRight, Check, Play } from "lucide-react";
import { Badge } from "../ui/badge";
import { DashboardPreview } from "./DashboardPreview";
import { Reveal } from "./Reveal";

const TRUST = ["trust1", "trust2", "trust3"] as const;

export async function HeroSection() {
  const t = await getTranslations("landing.hero");
  const tc = await getTranslations("common");
  return (
    <section className="relative overflow-hidden bg-background pt-32 pb-24 lg:pt-40 lg:pb-32">
      <div
        className="bg-grid pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-12">
          <div className="max-w-xl">
            <Reveal>
              <Badge variant="pill" pulse>
                {t("badge")}
              </Badge>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="heading-tight mt-6 text-[clamp(2.25rem,4.4vw,3.75rem)] text-foreground">
                {t.rich("title", richAccent)}
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 text-base leading-relaxed text-foreground-muted sm:text-lg">
                {t("subtitle")}
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                <a
                  href="/signup"
                  className="bg-cta group inline-flex items-center justify-center gap-2 rounded-[9px] px-7 py-3.5 text-sm font-bold"
                >
                  {tc("getStartedFree")}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-border-strong bg-transparent px-7 py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-surface-raised"
                >
                  <Play className="size-4" />
                  {t("secondary")}
                </a>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <ul className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2.5">
                {TRUST.map((item) => (
                  <li
                    key={t(item)}
                    className="label-mono flex items-center gap-1.5 text-[10px] text-foreground-muted"
                  >
                    <Check className="size-3.5 text-success" />
                    {t(item)}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={200} className="relative">
            <div className="relative mx-auto max-w-xl pt-8 md:pt-4">
              <DashboardPreview />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
