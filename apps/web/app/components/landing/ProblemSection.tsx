import { NotebookPen, Wallet, Calculator, ShieldQuestion } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SectionHeading, richAccent } from "./ui";
import { Reveal as RevealWrap } from "./Reveal";

const PROBLEMS = [
  {
    icon: NotebookPen,
    key: "scattered",
    color: "text-primary bg-primary/10 ring-primary/25",
  },
  {
    icon: Wallet,
    key: "deposits",
    color: "text-accent-warm bg-accent-warm/10 ring-accent-warm/25",
  },
  {
    icon: Calculator,
    key: "math",
    color: "text-destructive bg-destructive/10 ring-destructive/25",
  },
  {
    icon: ShieldQuestion,
    key: "trust",
    color: "text-success bg-success/10 ring-success/25",
  },
] as const;

export async function ProblemSection() {
  const t = await getTranslations("landing.problem");
  return (
    <section className="border-y border-border bg-surface-sunken py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t.rich("title", richAccent)}
          subtitle={t("subtitle")}
        />

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((problem, idx) => (
            <RevealWrap key={problem.key} delay={idx * 90}>
              <div className="group flex h-full flex-col rounded-2xl border border-border bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-lg hover:shadow-black/20">
                <span
                  className={`flex size-11 items-center justify-center rounded-xl ring-1 ${problem.color}`}
                >
                  <problem.icon className="size-5" />
                </span>
                <h3 className="mt-5 font-bold text-foreground font-heading">
                  {t(`items.${problem.key}.title`)}
                </h3>
                <ul className="mt-3 space-y-2">
                  {(["p1", "p2", "p3"] as const).map((item) => (
                    <li key={item} className="text-sm text-foreground-muted">
                      {t(`items.${problem.key}.${item}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealWrap>
          ))}
        </div>
      </div>
    </section>
  );
}
