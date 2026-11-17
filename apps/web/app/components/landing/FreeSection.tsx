import { getTranslations } from "next-intl/server";
import { richAccent } from "./ui";
import { Check } from "lucide-react";
import { Reveal } from "./Reveal";
import { PrimaryCta } from "./PrimaryCta";

const POINTS = ["p1", "p2", "p3"] as const;

export async function FreeSection() {
  const t = await getTranslations("landing.free");
  const tc = await getTranslations("common");
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-surface p-10 text-center lg:p-16">
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-4 py-1.5 text-xs font-bold text-success">
                <span className="size-1.5 rounded-full bg-success" />
                {t("badge")}
              </span>
              <h2 className="mx-auto mt-6 max-w-2xl text-3xl heading-tight text-foreground font-heading sm:text-4xl lg:text-5xl">
                {t.rich("title", richAccent)}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-foreground-muted">
                {t("subtitle")}
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                <PrimaryCta className="w-full rounded-[9px] px-8 py-3.5 text-sm sm:w-auto" />
                <a
                  href="/signin"
                  className="inline-flex w-full items-center justify-center rounded-[9px] border border-border-strong bg-transparent px-8 py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-surface-raised sm:w-auto"
                >
                  {tc("signIn")}
                </a>
              </div>

              <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
                {POINTS.map((point) => (
                  <li
                    key={t(point)}
                    className="flex items-center gap-1.5 text-sm text-foreground-muted"
                  >
                    <Check className="size-4 text-success" />
                    {t(point)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
