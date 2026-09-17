import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "./Reveal";

const POINTS = ["No pricing plans", "No trial windows", "No payment required"];

export function FreeSection() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-surface p-10 text-center lg:p-16">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 left-1/2 h-64 w-[560px] -translate-x-1/2 rounded-full bg-primary/15 blur-[100px]" />
            </div>

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-4 py-1.5 text-xs font-bold text-success">
                <span className="size-1.5 rounded-full bg-success" />
                Free for every mess
              </span>
              <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-extrabold tracking-tight text-foreground font-heading sm:text-4xl lg:text-5xl">
                Ready to Make Your Mess{" "}
                <span className="text-primary">Less Messy?</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base font-light leading-relaxed text-foreground-muted">
                Create a mess, invite your flatmates, and close your first
                accountable month tonight. It costs nothing but a minute of your
                time.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                <a
                  href="/signup"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-background shadow-[0_0_0_1px_rgba(6,182,212,0.4),0_0_32px_rgba(6,182,212,0.35)] transition-all hover:bg-primary-hover active:scale-[0.98] sm:w-auto"
                >
                  Get Started Free
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="/signin"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-foreground-muted/20 bg-surface-raised px-8 py-3.5 text-sm font-semibold text-foreground transition-all hover:border-primary/40 hover:text-primary sm:w-auto"
                >
                  Sign In
                </a>
              </div>

              <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
                {POINTS.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-1.5 text-sm text-foreground-muted"
                  >
                    <Check className="size-4 text-success" />
                    {point}
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
