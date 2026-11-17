import { getTranslations } from "next-intl/server";
import { richAccent } from "./ui";
import { ArrowRight, MessageSquareText, Smartphone } from "lucide-react";
import { Reveal } from "./Reveal";
import { PrimaryCta } from "./PrimaryCta";

export async function FinalCTASection() {
  const t = await getTranslations("landing.finalCta");
  const tc = await getTranslations("common");
  return (
    <section className="bg-background py-24 lg:py-36">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <Reveal>
          <h2 className="mt-4 text-4xl heading-tight text-foreground font-heading sm:text-5xl lg:text-6xl">
            {t.rich("title", richAccent)}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-foreground-muted sm:text-lg">
            {t("subtitle")}
          </p>
        </Reveal>

        <Reveal delay={140}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <PrimaryCta className="w-full rounded-[9px] px-9 py-4 text-sm sm:w-auto" />
            <a
              href="/signin"
              className="inline-flex w-full items-center justify-center gap-2 rounded-[9px] border border-border-strong bg-transparent px-9 py-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-surface-raised sm:w-auto"
            >
              <MessageSquareText className="size-4" />
              {tc("signIn")}
            </a>
          </div>
          <a
            href="/install"
            className="mt-6 hidden items-center gap-2 text-sm font-medium md:inline-flex text-foreground-muted transition-colors hover:text-primary"
          >
            <Smartphone className="size-4" />
            {t("installHint")}
            <ArrowRight className="size-3.5" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
