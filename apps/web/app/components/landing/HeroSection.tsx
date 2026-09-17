import { ArrowRight, Check, Play, Sparkles } from "lucide-react";
import { DashboardPreview } from "./DashboardPreview";
import { Reveal } from "./Reveal";

const TRUST = ["Free to use", "No payment required", "Built for shared living"];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pt-32 pb-24 lg:pt-40 lg:pb-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[540px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute right-[-160px] top-40 h-[380px] w-[380px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-12">
          <div className="max-w-xl">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary">
                <Sparkles className="size-3.5" />
                Mess Management, Simplified
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground font-heading sm:text-5xl lg:text-6xl">
                Manage Your Mess.
                <br />
                Track Everything.
                <br />
                Stay <span className="text-primary">Accountable.</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 text-base font-light leading-relaxed text-foreground-muted sm:text-lg">
                MessMate replaces the spreadsheets, notebook pages, and endless
                WhatsApp debates with one calm, transparent place to track
                meals, expenses, deposits, and monthly accounting for your
                shared living.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                <a
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-bold text-background shadow-[0_0_0_1px_rgba(6,182,212,0.4),0_0_32px_rgba(6,182,212,0.35)] transition-all hover:bg-primary-hover active:scale-[0.98]"
                >
                  Get Started Free
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-foreground-muted/20 bg-surface-raised px-7 py-3.5 text-sm font-semibold text-foreground transition-all hover:border-primary/40 hover:text-primary"
                >
                  <Play className="size-4" />
                  See How It Works
                </a>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <ul className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2.5">
                {TRUST.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-1.5 text-sm text-foreground-muted"
                  >
                    <Check className="size-4 text-success" />
                    {item}
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
