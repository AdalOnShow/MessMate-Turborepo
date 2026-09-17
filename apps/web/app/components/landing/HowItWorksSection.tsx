import { ArrowRight } from "lucide-react";
import { SectionHeading } from "./ui";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    title: "Create Your Mess",
    description:
      "Set up your mess profile, choose your meal types, and decide your monthly rules.",
  },
  {
    title: "Invite Members",
    description:
      "Share a unique join code. Roommates sign up and join instantly.",
  },
  {
    title: "Record Meals & Expenses",
    description:
      "Log daily meals, add bazaar and utility costs, collect deposits.",
  },
  {
    title: "Auto-Calculate Accounting",
    description:
      "Meal rate, bills, and balances are computed for you every month.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-foreground-muted/10 bg-surface py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            align="left"
            eyebrow="How It Works"
            title={
              <>
                Four Steps.{" "}
                <span className="text-primary">No Spreadsheets.</span>
              </>
            }
            subtitle="From an empty flat to a fully accounted mess month in under ten minutes."
          />
          <a
            href="/signup"
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-foreground-muted/15 bg-surface-raised px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            Start Your First Month
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, idx) => (
            <Reveal key={step.title} delay={idx * 100}>
              <div className="group border-t border-foreground-muted/15 pt-5 transition-colors duration-300 hover:border-primary/60">
                <span className="font-mono text-sm font-semibold tracking-widest text-primary">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-lg font-bold text-foreground font-heading">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-foreground-muted">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
