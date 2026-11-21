import { getTranslations } from "next-intl/server";
import { Smartphone } from "lucide-react";
import { PrimaryCta } from "./PrimaryCta";
import { Container } from "./ui";

export async function FinalCTASection() {
  const t = await getTranslations("landing.finalCta");
  const tc = await getTranslations("common");
  return (
    <section className="border-t border-border bg-surface-sunken py-20 lg:py-28">
      <Container className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="font-heading text-[clamp(2rem,4.4vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.035em] text-balance text-foreground">
            {t("title")}
          </h2>
          <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-foreground-muted sm:text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:col-span-5 lg:items-end">
          <div className="flex flex-col gap-3 sm:flex-row">
            <PrimaryCta className="rounded-[10px] px-8 py-4 text-[15px]" />
            <a
              href="/signin"
              className="inline-flex items-center justify-center rounded-[10px] border border-border-strong px-8 py-4 text-[15px] font-semibold text-foreground transition-colors hover:border-foreground-muted hover:bg-surface"
            >
              {tc("signIn")}
            </a>
          </div>
          <a
            href="/install"
            className="hidden items-center gap-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground md:inline-flex"
          >
            <Smartphone className="size-4" aria-hidden="true" />
            {t("installHint")}
          </a>
        </div>
      </Container>
    </section>
  );
}
