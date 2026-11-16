"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { SectionHeading, richAccent } from "./ui";
import { Reveal } from "./Reveal";

const FAQS = [
  "what",
  "free",
  "accounting",
  "join",
  "months",
  "manager",
  "balances",
  "visible",
] as const;

export function FAQSection() {
  const t = useTranslations("landing.faq");
  const [open, setOpen] = useState(0);

  return (
    <section
      id="faq"
      className="scroll-mt-20 border-y border-border bg-surface-sunken py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t.rich("title", richAccent)}
          subtitle={t("subtitle")}
        />

        <div className="mx-auto mt-14 max-w-3xl space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = open === idx;
            return (
              <Reveal key={faq} delay={idx * 40}>
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
                      {t(`items.${faq}.q`)}
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
                        {t(`items.${faq}.a`)}
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
