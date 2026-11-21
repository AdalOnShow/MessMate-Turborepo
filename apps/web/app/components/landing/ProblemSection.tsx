import { Check, X } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Container } from "./ui";

const NOTEBOOK = ["n1", "n2", "n3", "n4"] as const;
const APP = ["a1", "a2", "a3", "a4"] as const;

/** The notebook way vs. the MessMate way, line for line. */
export async function ProblemSection() {
  const t = await getTranslations("landing.problem");
  return (
    <section className="border-t border-border py-20 lg:py-24">
      <Container>
        <h2 className="max-w-[30ch] font-heading text-[clamp(1.5rem,2.8vw,2.125rem)] font-bold leading-[1.15] tracking-[-0.02em] text-balance text-foreground">
          {t("title")}
        </h2>

        <div className="mt-10 grid grid-cols-1 overflow-hidden rounded-2xl border border-border md:grid-cols-2">
          <div className="bg-surface-sunken p-6 sm:p-8">
            <h3 className="font-heading text-base font-semibold text-foreground-muted">
              {t("notebookTitle")}
            </h3>
            <ul className="mt-5 divide-y divide-border">
              {NOTEBOOK.map((key) => (
                <li
                  key={key}
                  className="flex gap-3 py-3 text-[15px] text-foreground-muted"
                >
                  <X
                    className="mt-0.5 size-4 shrink-0 text-destructive/80"
                    aria-hidden="true"
                  />
                  {t(`notebook.${key}`)}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-border bg-surface p-6 sm:p-8 md:border-t-0 md:border-l">
            <h3 className="font-heading text-base font-semibold text-foreground">
              {t("appTitle")}
            </h3>
            <ul className="mt-5 divide-y divide-border">
              {APP.map((key) => (
                <li
                  key={key}
                  className="flex gap-3 py-3 text-[15px] text-foreground-body"
                >
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {t(`app.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
