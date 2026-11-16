"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "./ui";
import { Reveal } from "./Reveal";

const FAQS = [
  {
    q: "What exactly is MessMate?",
    a: "MessMate is a free mess management app for shared living in Bangladesh. It replaces notebooks and spreadsheets with a calm dashboard for meal tracking, expenses, deposits, and automatic month-end accounting.",
  },
  {
    q: "Is MessMate really free?",
    a: "Yes. MessMate is 100% free to use, and there are no plans to charge for the core features. There is no pricing page, no trial window, no card asked — just create an account and go.",
  },
  {
    q: "Do I need to know accounting to use it?",
    a: "Not at all. MessMate computes the meal rate, each member's bill, and final balances automatically using total expenses divided by total meals. You just log what happened; the math is done for you.",
  },
  {
    q: "How do members join my mess?",
    a: "Create a mess and you get a unique, secure join code. Each flatmate signs up, enters the code, and is in — no approvals, no spreadsheets, no delays.",
  },
  {
    q: "How do months work?",
    a: "Months are manual: the mess runs open, and when the month ends a manager closes it. The month is frozen and archived, a new month opens, and balances carry forward automatically.",
  },
  {
    q: "Who can be a manager?",
    a: "The person who creates the mess is the first manager and can promote one more. MessMate allows up to two managers per mess, both with the same equal permissions.",
  },
  {
    q: "What happens to balances at month-end?",
    a: "A positive balance rolls forward as part of your next deposit. A negative balance becomes an individual expense you settle. Every month ends with a clear, fair number for everyone.",
  },
  {
    q: "Is everything visible to everyone?",
    a: "Yes — that's the point. Meal rates, deposits, expenses, balances, and the full activity history are visible to every member of the mess. Nothing hides behind a manager's desk.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState(0);

  return (
    <section
      id="faq"
      className="scroll-mt-20 border-y border-border bg-surface-sunken py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="FAQ"
          title={
            <>
              Questions, <span className="text-primary">Answered Honestly</span>
            </>
          }
          subtitle="The things flatmates actually ask before they convince the fourth member to sign up."
        />

        <div className="mx-auto mt-14 max-w-3xl space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = open === idx;
            return (
              <Reveal key={faq.q} delay={idx * 40}>
                <div
                  className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
                    isOpen
                      ? "border-primary/30 bg-surface-raised"
                      : "border-border bg-surface-raised/50 hover:border-border-strong"
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : idx)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="font-bold text-foreground font-heading">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`size-5 shrink-0 text-primary transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm leading-relaxed text-foreground-muted">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
