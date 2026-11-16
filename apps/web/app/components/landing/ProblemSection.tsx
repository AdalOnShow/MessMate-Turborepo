import { NotebookPen, Wallet, Calculator, ShieldQuestion } from "lucide-react";
import { SectionHeading } from "./ui";
import { Reveal as RevealWrap } from "./Reveal";

const PROBLEMS = [
  {
    icon: NotebookPen,
    title: "Scattered Records",
    people: [
      "Meals in a notebook",
      "Bazaar in another",
      "Deposits in the group chat",
    ],
    color: "text-primary bg-primary/10 ring-primary/25",
  },
  {
    icon: Wallet,
    title: "Ambiguous Deposits",
    people: [
      '"Did I pay you already?"',
      '"That was the other Rahim."',
      "Half-paid / over-paid slates",
    ],
    color: "text-accent-warm bg-accent-warm/10 ring-accent-warm/25",
  },
  {
    icon: Calculator,
    title: "Slow Month-End Math",
    people: [
      "Manual meal-rate division",
      "Deposit take-offs by hand",
      "Balances nobody can verify",
    ],
    color: "text-destructive bg-destructive/10 ring-destructive/25",
  },
  {
    icon: ShieldQuestion,
    title: "Trust Runs Thin",
    people: [
      "Arguments over who owes what",
      "The manager looks like the bank",
      "No single source of truth",
    ],
    color: "text-success bg-success/10 ring-success/25",
  },
];

export function ProblemSection() {
  return (
    <section className="border-y border-border bg-surface-sunken py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The Problem"
          title={
            <>
              Mess Accounting Gets <span className="text-primary">Messy</span>{" "}
              Fast
            </>
          }
          subtitle="MessMate started with a simple frustration — shared-living money was always a mess. Notebook entries got lost, deposits became ambiguous, and every month-end turned into a three-hour argument."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((problem, idx) => (
            <RevealWrap key={problem.title} delay={idx * 90}>
              <div className="group flex h-full flex-col rounded-2xl border border-border bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-lg hover:shadow-black/20">
                <span
                  className={`flex size-11 items-center justify-center rounded-xl ring-1 ${problem.color}`}
                >
                  <problem.icon className="size-5" />
                </span>
                <h3 className="mt-5 font-bold text-foreground font-heading">
                  {problem.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {problem.people.map((item) => (
                    <li key={item} className="text-sm text-foreground-muted">
                      {item}
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
