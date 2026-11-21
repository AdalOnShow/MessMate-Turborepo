import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Container } from "./ui";

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

/** Native <details>: keyboard and screen-reader support with no client JS. */
export async function FAQSection() {
  const t = await getTranslations("landing.faq");

  return (
    <section
      id="faq"
      className="scroll-mt-20 border-t border-border py-20 lg:py-28"
    >
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <h2 className="font-heading text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-foreground lg:col-span-4">
          {t("title")}
        </h2>

        <div className="divide-y divide-border border-y border-border lg:col-span-8">
          {FAQS.map((faq, idx) => (
            <details key={faq} className="group" open={idx === 0}>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left font-heading text-base font-semibold text-foreground transition-[color,padding] duration-300 hover:pl-2 hover:text-primary sm:text-[17px] [&::-webkit-details-marker]:hidden">
                {t(`items.${faq}.q`)}
                <Plus
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-foreground-muted transition-transform duration-300 group-hover:rotate-90 group-hover:text-primary group-open:rotate-45"
                />
              </summary>
              <p className="max-w-[62ch] pb-6 text-[15px] leading-relaxed text-foreground-muted">
                {t(`items.${faq}.a`)}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
