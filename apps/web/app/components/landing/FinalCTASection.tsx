import { ArrowRight, MessageSquareText } from "lucide-react";
import { Reveal } from "./Reveal";

export function FinalCTASection() {
  return (
    <section className="bg-background py-24 lg:py-36">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <Reveal>
          <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-foreground font-heading sm:text-5xl lg:text-6xl">
            Stop Managing Your Mess{" "}
            <span className="text-primary">in Spreadsheets.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base font-light leading-relaxed text-foreground-muted sm:text-lg">
            Create your mess tonight, track tomorrow&apos;s meals, and be the
            first flatmate who shows up at month-end with the numbers — already
            done.
          </p>
        </Reveal>

        <Reveal delay={140}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <a
              href="/signup"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-9 py-4 text-sm font-bold text-background shadow-[0_0_0_1px_rgba(6,182,212,0.4),0_0_40px_rgba(6,182,212,0.4)] transition-all hover:bg-primary-hover active:scale-[0.98] sm:w-auto"
            >
              Get Started Free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="/signin"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-foreground-muted/20 bg-surface-raised px-9 py-4 text-sm font-semibold text-foreground transition-all hover:border-primary/40 hover:text-primary sm:w-auto"
            >
              <MessageSquareText className="size-4" />
              Sign In
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
